<?php

namespace Presentation\User\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Webhook;

class StripeWebhookController extends Controller
{
    /**
     * Handle incoming Stripe webhook events.
     * Stripe signs every request — we verify the signature before processing.
     */
    public function handle(Request $request)
    {
        $payload   = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');
        $secret    = config('services.stripe.webhook_secret');

        // ── 1. Verify Stripe signature ─────────────────────────────────────────
        if ($secret) {
            try {
                $event = Webhook::constructEvent($payload, $sigHeader, $secret);
            } catch (SignatureVerificationException $e) {
                Log::warning('Stripe webhook signature verification failed: ' . $e->getMessage());
                return response()->json(['error' => 'Invalid signature'], 400);
            }
        } else {
            // In development without a secret, parse the raw payload
            $event = json_decode($payload);
            Log::warning('Stripe webhook secret not configured — skipping signature verification');
        }

        Log::info('Stripe webhook received: ' . $event->type);

        // ── 2. Route the event to the appropriate handler ──────────────────────
        match ($event->type) {
            'invoice.payment_succeeded'       => $this->handlePaymentSucceeded($event->data->object),
            'invoice.payment_failed'          => $this->handlePaymentFailed($event->data->object),
            'customer.subscription.deleted'   => $this->handleSubscriptionDeleted($event->data->object),
            'customer.subscription.updated'   => $this->handleSubscriptionUpdated($event->data->object),
            default => Log::info("Stripe webhook event ignored: {$event->type}"),
        };

        return response()->json(['status' => 'ok']);
    }

    /**
     * Handle successful invoice payment (subscription renewal).
     * Resets the monthly PDF counter and extends the subscription.
     */
    private function handlePaymentSucceeded(object $invoice): void
    {
        $subscriptionId = $invoice->subscription ?? null;
        if (! $subscriptionId) {
            return;
        }

        $user = User::where('stripe_subscription_id', $subscriptionId)->first();
        if (! $user) {
            Log::warning("Webhook: No user found for subscription {$subscriptionId}");
            return;
        }

        // Reset monthly PDF counter on each successful billing cycle
        $user->update([
            'pdf_count'          => 0,
            'pdf_count_reset_at' => now()->addMonth(),
            'subscription_ends_at' => now()->addMonth(),
        ]);

        Log::info("Webhook: PDF counter reset for user #{$user->id} after successful payment");
    }

    /**
     * Handle failed invoice payment.
     * Marks the subscription as inactive after grace period.
     */
    private function handlePaymentFailed(object $invoice): void
    {
        $subscriptionId = $invoice->subscription ?? null;
        if (! $subscriptionId) {
            return;
        }

        $user = User::where('stripe_subscription_id', $subscriptionId)->first();
        if (! $user) {
            Log::warning("Webhook: No user found for subscription {$subscriptionId} (payment failed)");
            return;
        }

        // Mark subscription as ending in 3 days (grace period) 
        $user->update([
            'subscription_ends_at' => now()->addDays(3),
        ]);

        Log::warning("Webhook: Payment failed for user #{$user->id}. Grace period set.");
    }

    /**
     * Handle subscription cancellation/deletion by Stripe.
     * Reverts the user to the Basic (free) plan.
     */
    private function handleSubscriptionDeleted(object $subscription): void
    {
        $user = User::where('stripe_subscription_id', $subscription->id)->first();
        if (! $user) {
            Log::warning("Webhook: No user found for deleted subscription {$subscription->id}");
            return;
        }

        $basicPlan = Plan::where('slug', 'basic')->first();

        $user->update([
            'stripe_subscription_id' => null,
            'subscription_ends_at'   => now(),
            'plan_id'                => $basicPlan?->id,
            'pdf_count'              => 0,
            'pdf_count_reset_at'     => now()->addMonth(),
        ]);

        Log::info("Webhook: Subscription deleted for user #{$user->id}. Reverted to basic plan.");
    }

    /**
     * Handle subscription plan changes (upgrade/downgrade) initiated from Stripe Dashboard.
     */
    private function handleSubscriptionUpdated(object $subscription): void
    {
        $user = User::where('stripe_subscription_id', $subscription->id)->first();
        if (! $user) {
            return;
        }

        // Update subscription end date based on Stripe's data
        $endsAt = isset($subscription->current_period_end)
            ? \Carbon\Carbon::createFromTimestamp($subscription->current_period_end)
            : now()->addMonth();

        $user->update([
            'subscription_ends_at' => $endsAt,
        ]);

        Log::info("Webhook: Subscription updated for user #{$user->id}");
    }
}
