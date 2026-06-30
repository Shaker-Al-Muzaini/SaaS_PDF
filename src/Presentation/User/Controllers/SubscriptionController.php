<?php

namespace Controllers;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Stripe\Checkout\Session;
use Stripe\Exception\CardException;
use Stripe\Stripe;
use Stripe\StripeClient;

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
            $stripe = new StripeClient(config('services.stripe.secret'));
            $user = $request->user();

            // إنشاء عميل جديد في Stripe أو جلب بياناته إذا كان مسجلاً مسبقاً
            if (! $user->stripe_customer_id) {
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
            Log::error('Payment intent creation failed: '.$e->getMessage());

            return response()->json([
                'error' => 'Failed to create payment intent: '.$e->getMessage(),
            ], 500);
        }
    }

    public function subscribe(Request $request, $slug)
    {
        Log::info('subscribe request:', $request->all());
        $request->validate([
            'stripeToken' => 'required|string',
        ]);

        $plan = Plan::where('slug', $slug)->where('is_active', true)->firstOrFail();
        $user = $request->user();

        Log::info('subscribe plan:', $plan->toArray());

        try {
            $stripe = new StripeClient(config('services.stripe.secret'));

            // Create or retrieve Stripe customer
            if (! $user->stripe_customer_id) {
                $customer = $stripe->customers->create([
                    'email' => $user->email,
                    'name' => $user->name,
                    'source' => $request->stripeToken,
                    'metadata' => [
                        'user_id' => $user->id,
                    ],
                ]);
                $user->update(['stripe_customer_id' => $customer->id]);
            } else {
                $customer = $stripe->customers->retrieve($user->stripe_customer_id);
            }

            // Update customer's payment source
            $stripe->customers->update($customer->id, [
                'source' => $request->stripeToken,
            ]);

            // Create price for the plan
            $price = $stripe->prices->create([
                'currency' => 'usd',
                'unit_amount' => $plan->price * 100, // Convert to cents
                'recurring' => [
                    'interval' => 'month',
                ],
                'product_data' => [
                    'name' => $plan->name.' Plan',
                    'des' => $plan->description,
                ],
            ]);

            // Create subscription
            $subscription = $stripe->subscriptions->create([
                'customer' => $customer->id,
                'items' => [
                    ['price' => $price->id],
                ],
                'metadata' => [
                    'plan_id' => $plan->id,
                    'user_id' => $user->id,
                ],
            ]);

            // Update user with subscription details
            $user->update([
                'plan_id' => $plan->id,
                'stripe_subscription_id' => $subscription->id,
                'pdf_count' => 0,
                'pdf_count_reset_at' => now()->addMonth(),
                'subscription_ends_at' => now()->addMonth(),
            ]);

            return redirect()->route('dashboard')->with('success', 'Subscription activated successfully!');
        } catch (CardException $e) {
            Log::error('Stripe card error: '.$e->getMessage());

            return redirect()->back()->with('error', 'Card error: '.$e->getError()->message);
        } catch (\Exception $e) {
            Log::error('Subscription error: '.$e->getMessage());

            return redirect()->back()->with('error', 'Failed to process subscription: '.$e->getMessage());
        }
    }

    public function createCheckoutSession(Request $request, $slug)
    {
        // Log::info('createCheckoutSession slug:', $slug);
        Log::info('createCheckoutSession request:', $request->all());
        $plan = Plan::where('slug', $slug)->where('is_active', true)->firstOrFail();
        $user = $request->user();

        try {
            $session = Session::create([
                'payment_method_types' => ['card'],
                'line_items' => [[
                    'price_data' => [
                        'currency' => 'usd',
                        'product_data' => [
                            'name' => $plan->name,
                        ],
                        'unit_amount' => $plan->price * 100, // Convert to cents
                        'recurring' => [
                            'interval' => 'month',
                        ],
                    ],
                    'quantity' => 1,
                ]],
                'mode' => 'subscription',
                'success_url' => route('subscription.success').'?session_id={CHECKOUT_SESSION_ID}',
                'cancel_url' => route('checkout', ['slug' => $slug]),
                'customer_email' => $user->email,
                'client_reference_id' => $user->id,
                'metadata' => [
                    'plan_id' => $plan->id,
                    'user_id' => $user->id,
                ],
            ]);

            return Inertia::location($session->url);
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function success(Request $request)
    {
        Log::info('success request:', $request->all());
        $sessionId = $request->get('session_id');

        if (! $sessionId) {
            return redirect()->route('dashboard')->with('error', 'Invalid session');
        }

        try {
            $session = Session::retrieve($sessionId);
            $user = $request->user();

            // Update user with subscription details
            $user->update([
                'stripe_customer_id' => $session->customer,
                'stripe_subscription_id' => $session->subscription,
                'plan_id' => $session->metadata->plan_id,
                'pdf_count' => 0,
                'pdf_count_reset_at' => now()->addMonth(),
            ]);

            return redirect()->route('dashboard')->with('success', 'Subscription activated successfully!');
        } catch (\Exception $e) {
            return redirect()->route('dashboard')->with('error', 'Failed to activate subscription');
        }
    }

    public function cancel(Request $request)
    {
        Log::info('cancel request:', $request->all());
        $user = $request->user();

        if (! $user->stripe_subscription_id) {
            return back()->with('error', 'No active subscription found');
        }

        try {
            $stripe = new StripeClient(config('services.stripe.secret'));

            $stripe->subscriptions->cancel($user->stripe_subscription_id);

            $user->update([
                'subscription_ends_at' => now()->addDays(30), // Grace period
            ]);

            return back()->with('success', 'Subscription will be cancelled at the end of the billing period');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to cancel subscription: '.$e->getMessage());
        }
    }

    public function changePlan(Request $request)
    {
        Log::info('changePlan request:', $request->all());
        $request->validate([
            'plan_slug' => 'required|exists:plans,slug',
        ]);

        $user = $request->user();
        $newPlan = Plan::where('slug', $request->plan_slug)->firstOrFail();

        if (! $user->stripe_subscription_id) {
            return back()->with('error', 'No active subscription found');
        }

        try {
            $stripe = new StripeClient(config('services.stripe.secret'));
            $subscription = $stripe->subscriptions->retrieve($user->stripe_subscription_id);

            // Update the subscription with the new plan
            $stripe->subscriptions->update($user->stripe_subscription_id, [
                'items' => [
                    [
                        'id' => $subscription->items->data[0]->id,
                        'price_data' => [
                            'currency' => 'usd',
                            'product_data' => [
                                'name' => $newPlan->name.' Plan',
                            ],
                            'unit_amount' => $newPlan->price * 100,
                            'recurring' => [
                                'interval' => 'month',
                            ],
                        ],
                    ],
                ],
                'proration_behavior' => 'create_prorations',
            ]);

            $user->update([
                'plan_id' => $newPlan->id,
                'pdf_count' => 0,
                'pdf_count_reset_at' => now()->addMonth(),
            ]);

            return back()->with('success', 'Plan changed successfully!');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to change plan: '.$e->getMessage());
        }
    }
}
