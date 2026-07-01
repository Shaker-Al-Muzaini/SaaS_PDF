import { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { CheckIcon, CreditCardIcon, LockIcon, ArrowLeftIcon, SparklesIcon } from 'lucide-react';

interface Plan {
    id: number;
    name: string;
    slug: string;
    description: string;
    price: number;
    pdf_limit: number;
    features: string[];
}

interface Props {
    plan: Plan;
    stripeKey: string;
}

export default function Checkout({ plan,stripeKey }: Props) {
    const { flash } = usePage().props as any;
    // Parse features if they're stored as JSON string
    const safePlan = {
        ...plan,
        features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features
    };

    const [processing, setProcessing] = useState(false);

    useEffect(() => {}, []);

    const handlePayment = () => {
        if (processing) return;

        setProcessing(true);

        router.post(`/subscription/create-checkout-session/${safePlan.slug}`, {}, {
            onError: (errors: { message?: string }) => {
                alert('Payment failed: ' + (errors.message || 'Please try again'));
                setProcessing(false);
            },
            onFinish: () => {
                setProcessing(false);
            }
        });
    };

    return (
        <>
            <Head title={`Checkout - ${safePlan.name} Plan`} />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950 pt-24 pb-12">
                {/* Navigation */}
                <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            <Link href="/" className="flex items-center gap-3 text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                                <ArrowLeftIcon className="h-5 w-5" />
                                <span className="font-medium text-sm">Back to dashboard</span>
                            </Link>
                            <div className="flex items-center gap-2">
                                <SparklesIcon className="h-5 w-5 text-violet-500 animate-pulse" />
                                <span className="font-semibold text-slate-900 dark:text-white">PDF Summarizer</span>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Main Layout Grid */}
                <main className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl mt-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                        {/* Left Column - Plan Details */}
                        <div className="animate-in fade-in slide-in-from-left duration-700 delay-200 rounded-3xl border border-violet-200 dark:border-violet-500/30 bg-white/60 dark:bg-slate-900/40 backdrop-blur-md p-6 sm:p-8 shadow-xl">
                            <div className="flex items-center justify-between mb-6 gap-4">
                                <h2 className="text-3xl font-black bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                                    {safePlan.name} Plan
                                </h2>
                                <div className="text-right shrink-0">
                                    <div className="text-slate-600 dark:text-slate-400">
                                        <span className="text-3xl font-black text-slate-900 dark:text-white">${safePlan.price}</span>
                                        <span className="text-sm font-medium block">per month</span>
                                    </div>
                                </div>
                            </div>

                            <p className="text-slate-600 dark:text-slate-400 mb-6 text-lg leading-relaxed">
                                {safePlan.description || "Plan subscription Details"}
                            </p>

                            <div className="space-y-4">
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">What's included:</h3>
                                {safePlan.features && safePlan.features.map((feature: string, index: number) => (
                                    <div key={index} className="flex items-start gap-3">
                                        <div className="mt-1 flex-shrink-0">
                                            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md">
                                                <CheckIcon className="h-3.5 w-3.5 text-white" />
                                            </div>
                                        </div>
                                        <span className="text-slate-700 dark:text-slate-300 font-medium">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                                <div className="flex justify-between items-center text-lg">
                                    <span className="font-bold text-slate-900 dark:text-white">Total due today:</span>
                                    <span className="text-3xl font-black bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                                        ${safePlan.price}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                                    Billed monthly. Cancel anytime.
                                </p>
                            </div>

                            <div className="animate-in fade-in slide-in-from-left duration-700 delay-400 flex items-start gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200/60 dark:border-green-900/40 mt-6">
                                <LockIcon className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                                <p className="text-sm text-green-800 dark:text-green-300 font-medium">
                                    Secure payment powered by Stripe. Your data is encrypted and safe.
                                </p>
                            </div>
                        </div>

                        {/* Right Column - Payment Form */}
                        <div className="animate-in fade-in slide-in-from-right duration-700">
                            <div className="sticky top-24 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl">
                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-slate-900 dark:text-white">
                                    <CreditCardIcon className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                                    Payment Details
                                </h2>

                                {flash?.error && (
                                    <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/40 text-sm text-red-800 dark:text-red-300 font-medium">
                                        {flash.error}
                                    </div>
                                )}

                                <button
                                    onClick={handlePayment}
                                    disabled={processing}
                                    className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold shadow-xl shadow-violet-500/20 hover:shadow-violet-500/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                >
                                    {processing ? (
                                        <span className="flex items-center justify-center gap-3">
                                            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Processing...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            <LockIcon className="h-5 w-5" />
                                            Pay ${safePlan.price}/month
                                        </span>
                                    )}
                                </button>

                                <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">
                                    By confirming your subscription, you allow PDF Summarizer to charge your card for this payment and future renewals.
                                </p>
                            </div>
                        </div>

                    </div>
                </main>
            </div>
        </>
    );
}
