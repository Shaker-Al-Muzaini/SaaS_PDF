<?php

namespace Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Plan;
use Stripe\Stripe;
use Stripe\Checkout\Session;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class SubscriptionController extends Controller
{
    public function __construct()
    {
        Stripe::setApiKey(config('services.stripe.secret'));
    }

    public function createPaymentIntent(Request $request)
    {
        // تسجيل بيانات الطلب الوارد للمراقبة والتصحيح
        Log::info('createPaymentIntent request:', $request->all());

        // التحقق من المدخلات
        $request->validate([
            'amount' => 'required|numeric|min:0',
            'plan_slug' => 'required|string',
        ]);

        try {
            // إنشاء كائن عميل Stripe باستخدام المفتاح السري من الإعدادات
            $stripe = new \Stripe\StripeClient(config('services.stripe.secret'));
            $user = $request->user();

            // إنشاء عميل جديد في Stripe أو جلب بياناته إذا كان مسجلاً مسبقاً
            if (!$user->stripe_customer_id) {
                $customer = $stripe->customers->create([
                    'email' => $user->email,
                    'name' => $user->name,
                    'metadata' => [
                        'user_id' => $user->id,
                    ],
                ]);
                // تحديث بيانات المستخدم في قاعدة البيانات بحساب العميل الجديد
                $user->update(['stripe_customer_id' => $customer->id]);
            } else {
                $customer = $stripe->customers->retrieve($user->stripe_customer_id);
            }

            // إنشاء عملية الدفع (Payment Intent)
            $paymentIntent = $stripe->paymentIntents->create([
                'amount' => $request->amount, // المبلغ بالـ Cents (مثال: 10 دولارات تكتب 1000)
                'currency' => 'usd',
                'customer' => $customer->id,
                'payment_method_types' => ['card'], // تحديد الدفع بالبطاقات الائتمانية
                'metadata' => [
                    'user_id' => $user->id,
                    'plan_slug' => $request->plan_slug,
                ],
            ]);

            // إرجاع مفتاح العميل السري لواجهة المستخدم (Frontend) لإتمام عملية الدفع
            return response()->json([
                'clientSecret' => $paymentIntent->client_secret,
            ]);

        } catch (\Exception $e) {
            // تسجيل الخطأ وإرجاع رسالة فشل في حال حدوث مشكلة مع Stripe
            Log::error('Payment intent creation failed: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to create payment intent: ' . $e->getMessage()
            ], 500);
        }
    }


}
