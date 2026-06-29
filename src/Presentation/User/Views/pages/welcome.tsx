import React, { useState, useRef, useEffect, type DragEvent } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { CheckIcon, SparklesIcon, ZapIcon, RocketIcon, ArrowRightIcon, StarIcon } from 'lucide-react';
import FlashMessage from '../components/FlashMessage';
import SummaryModal from '../components/SummaryModal';
import SummaryOptionsModal from '../components/SummaryOptionsModal';

interface Plan {
    id: number;
    name: string;
    slug: string;
    des: string;
    price: number;
    pdf_limit: number;
    features: string[] | string;
}

interface Props {
    plans?: Plan[];
    canRegister?: boolean;
    auth?: {
        user: any;
    };
    userStats?: { pdfCount: number; pdfLimit: number; canUpload: boolean } | null;
    flash?: { success?: string; error?: string };
}

type SummaryType = 'default' | 'points' | 'highlights' | 'detailed';

export default function Welcome({ plans = [], canRegister, auth, userStats, flash }: Props) {
    const [pdf, setPdf] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [summary, setSummary] = useState('');
    const [showSummary, setShowSummary] = useState(false);
    const [showSummaryOptions, setShowSummaryOptions] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const limitReached = !!(userStats && !userStats.canUpload);
    const userPlanSlug = auth?.user?.plan?.slug || 'basic';

    const safePlans = Array.isArray(plans) ? plans.map(plan => ({
        ...plan,
        features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features
    })) : [];

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const handleFileSelect = (file: File) => {
        if (limitReached) {
            alert(`PDF limit reached (${userStats?.pdfCount}/${userStats?.pdfLimit}). Please upgrade.`);
return;
}
setSelectedFile(file);
setPdf(file);
setShowSummaryOptions(true);
};

const handleSummaryTypeSelect = async (type: SummaryType) => {
    setShowSummaryOptions(false);
    if (!selectedFile || !auth?.user) return;

    setLoading(true);
    setProgress(0);
    setSummary('');

    const formData = new FormData();
    formData.append('pdf', selectedFile);
    formData.append('summary_type', type);

    const progressInterval = setInterval(() => {
        setProgress(prev => prev >= 90 ? 90 : prev + 10);
    }, 200);

    const csrfToken = document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] || '';
    const response = await fetch('/pdf/summarize', {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json', 'X-XSRF-TOKEN': decodeURIComponent(csrfToken) },
    });

    clearInterval(progressInterval);

    if (!response.ok) {
        setLoading(false);
        setProgress(0);
        alert('Failed to generate summary');
        return;
    }

    const data = await response.json();
    let cleanSummary = data.summary || '';
    cleanSummary = cleanSummary.replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, ' ').trim();
    setProgress(100);
    cleanSummary = cleanSummary.replace(/\*\*/g, '').replace(/\*/g, '').replace(/^#+\s/gm, '').replace(/^-\s/gm, '');
    setSummary(cleanSummary);

    setTimeout(() => {
        setLoading(false);
        setShowSummary(true);
    }, 500);
};

const handleDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); if (auth?.user) setIsDragging(true); };
const handleDragLeave = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); };
const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type === 'application/pdf') handleFileSelect(file);
};

const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type === 'application/pdf') handleFileSelect(file);
};

const handleNewUpload = () => {
    setPdf(null);
    setSummary('');
    setShowSummary(false);
    setSelectedFile(null);
};

const getPlanIcon = (slug: string) => {
    if (slug === 'standard') return <ZapIcon className="h-8 w-8" />;
    if (slug === 'premium') return <RocketIcon className="h-8 w-8" />;
    return <SparklesIcon className="h-8 w-8" />;
};

const handlePlanClick = (plan: Plan) => {
    router.visit(plan.slug === 'basic' ? '/register' : `/checkout/${plan.slug}`);
};

return (
    <>
        <Head title="PDF Summarizer - AI-Powered Document Summaries" />

        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950 overflow-hidden">
            <FlashMessage flash={flash} />

            {/* Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute top-1/2 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
            </div>

            {/* Modals */}
            <SummaryOptionsModal
                show={showSummaryOptions && !!selectedFile}
                fileName={selectedFile?.name}
                userPlanSlug={userPlanSlug}
                onClose={() => { setShowSummaryOptions(false); setSelectedFile(null); setPdf(null); }}
                onSelect={handleSummaryTypeSelect}
            />

            <SummaryModal
                show={showSummary}
                summary={summary}
                fileName={pdf?.name}
                onClose={() => setShowSummary(false)}
                onNewUpload={handleNewUpload}
            />

            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 shadow-lg">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg">
                                <SparklesIcon className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                                    PDF Summarizer
                                </span>
                        </div>

                        {/* Navigation Actions (Auth Links) */}
                        <div className="flex items-center gap-4">
                            {auth?.user ? (
                                <Link
                                    href="/dashboard"
                                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium hover:scale-105 transition-transform inline-flex items-center"
                                >
                                    Dashboard
                                    <ArrowRightIcon className="inline h-4 w-4 ml-1" />
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 font-medium transition-colors"
                                    >
                                        Log in
                                    </Link>

                                    {canRegister && (
                                        <Link
                                            href="/register"
                                            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium hover:scale-105 transition-transform"
                                        >
                                            Sign up
                                        </Link>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="container mx-auto max-w-6xl">
                    <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>

                        {/* Badges Container */}
                        <div className="flex flex-wrap justify-center gap-3 mb-6">
                                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium shadow-lg">
                                    <StarIcon className="h-4 w-4" />
                                    AI-Powered
                                </span>

                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium shadow-lg">
                                    <ZapIcon className="h-4 w-4" />
                                    Lightning Fast
                                </span>
                        </div>

                        {/* Main Heading */}
                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
                                <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                    Summarize PDFs with AI
                                </span>
                            <br />
                            <span className="text-4xl sm:text-5xl font-bold text-slate-700 dark:text-slate-300">
                                    in Seconds
                                </span>
                        </h1>

                        {/* Description Paragraph */}
                        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed mb-8">
                            Transform lengthy documents into concise summaries using advanced AI technology.
                        </p>

                        {/* Upload Area */}
                        <div className="container mx-auto max-w-4xl px-4 pb-10">
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => !loading && !limitReached && fileInputRef.current?.click()}
                                className={`group relative p-12 rounded-3xl border-2 border-dashed text-center transition-all duration-500 ${
                                    limitReached
                                        ? 'border-red-300 bg-red-50/50 cursor-not-allowed'
                                        : isDragging
                                            ? 'border-violet-500 bg-violet-50/50 scale-105 shadow-2xl'
                                            : 'border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-violet-400 hover:bg-violet-50/30 dark:hover:bg-violet-950/10'
                                } ${auth?.user && !loading && !limitReached ? 'cursor-pointer' : ''}`}
                            >
                                {/* Hidden File Input */}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="application/pdf"
                                    className="hidden"
                                    disabled={loading || limitReached}
                                />

                                {loading ? (
                                    /* Loading State */
                                    <div className="flex flex-col items-center gap-8 py-4">
                                        <div className="relative h-32 w-32">
                                            <div className="h-32 w-32 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600"></div>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <SparklesIcon className="h-12 w-12 text-violet-600 animate-pulse" />
                                            </div>
                                        </div>

                                        <div className="space-y-4 w-full max-w-md mx-auto">
                                            <h3 className="text-3xl font-black bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                                                Processing...
                                            </h3>
                                            <div className="w-full h-4 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                                                <div
                                                    className="h-full bg-gradient-to-r from-violet-500 to-purple-600 transition-all duration-300"
                                                    style={{ width: `${progress}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-slate-600 dark:text-slate-400 font-medium">{progress}%</p>
                                        </div>
                                    </div>
                                ) : (
                                    /* Default Upload State */
                                    <>
                                        <div className="mx-auto mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 shadow-2xl group-hover:scale-110 transition-transform">
                                            <svg
                                                className="h-16 w-16 text-white"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                                />
                                            </svg>
                                        </div>
                                        <h3 className="mb-4 text-4xl font-black bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                                            {limitReached ? 'Limit Reached' : pdf ? pdf.name : 'Drop your PDF here'}
                                        </h3>

                                        <p className="text-slate-600">
                                            {auth?.user ? (limitReached ? 'Please upgrade your plan' : 'or click to browse') : 'Sign up to start'}
                                        </p>

                                        {!auth?.user && (
                                            <Link href="/register" className="mt-8 inline-flex items-center justify-center gap-3 px-12 py-5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xl font-bold hover:scale-105 transition-transform mx-auto">
                                                <SparklesIcon className="h-7 w-7" /> Sign up to start <ArrowRightIcon className="h-6 w-6" />
                                            </Link>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            {auth?.user && safePlans.length > 0 && (
                <section className="relative py-20 px-4 bg-white/50 backdrop-blur-sm">
                    <div className="container mx-auto max-w-7xl">
                        <div className="text-center mb-16">
                            <h2 className="text-5xl font-black mb-12 bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                                Choose Your Plan
                            </h2>

                            <div className="grid md:grid-cols-3 gap-8 text-left ">
                                {safePlans.map((plan) => {
                                    const isCurrentPlan = userPlanSlug === plan.slug;
                                    return (
                                        <div key={plan.id} className="relative group p-8 rounded-3xl bg-white border border-slate-100 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between">
                                            {plan.slug === 'standard' && (
                                                <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold rounded-full shadow-md tracking-wider uppercase">
                                                        Most Popular
                                                    </span>
                                            )}

                                            {isCurrentPlan && (
                                                <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-full shadow-md tracking-wider uppercase">
                                                        Current Plan
                                                    </span>
                                            )}

                                            <div>
                                                <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg group-hover:scale-110 transition-transform mb-6">
                                                    {getPlanIcon(plan.slug)}
                                                </div>

                                                <h3 className="text-3xl font-black mb-3 text-blue-600">{plan.name}</h3>
                                                <p className="text-slate-600 mb-6">{plan.des}</p>

                                                <div className="flex items-baseline gap-2 mb-6">
                                                        <span className="text-5xl font-black bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                                                            ${plan.price}
                                                        </span>
                                                    <span className="text-xl text-slate-600">/month</span>
                                                </div>

                                                <ul className="space-y-4 mb-8">
                                                    {Array.isArray(plan.features) && plan.features.map((feature: string, idx: number) => (
                                                        <li key={idx} className="flex items-start gap-3">
                                                            <div className="h-6 w-6 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mt-0.5">
                                                                <CheckIcon className="h-4 w-4 text-white" />
                                                            </div>
                                                            <span className="text-slate-700">{feature}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <button
                                                onClick={() => handlePlanClick(plan)}
                                                disabled={isCurrentPlan}
                                                className={`w-full py-4 rounded-xl font-bold text-lg transition-all mt-auto ${
                                                    isCurrentPlan
                                                        ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                                        : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:scale-105'
                                                }`}
                                            >
                                                {isCurrentPlan ? 'Active Plan' : plan.slug === 'basic' ? 'Get Started Free' : 'Subscribe Now'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Features Section */}
            <section className="relative py-20 px-4">
                <div className="container mx-auto max-w-6xl">
                    <h2 className="text-5xl font-black mb-16 text-center bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                        Why Choose Us?
                    </h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { icon: SparklesIcon, title: 'AI-Powered', desc: 'Advanced AI for accurate summaries' },
                            { icon: ZapIcon, title: 'Lightning Fast', desc: 'Get summaries in seconds' },
                            { icon: RocketIcon, title: 'Easy to Use', desc: 'Simple interface, powerful results' }
                        ].map((feature, idx) => (
                            <div key={idx} className="group text-center p-8 rounded-3xl bg-white border-2 border-slate-200 hover:border-violet-500 hover:scale-105 transition-all">
                                <div className="inline-flex p-5 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white mb-6 shadow-lg group-hover:scale-110 transition-transform">
                                    <feature.icon className="h-10 w-10" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-slate-600">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-4 bg-white border-t">
                <div className="container mx-auto max-w-6xl text-center">
                    <p className="text-slate-600">© 2024 PDF Summarizer. All rights reserved.</p>
                </div>
            </footer>
        </div>

        <style>{`
                @keyframes gradient {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                .animate-gradient {
                    background-size: 200% 200%;
                    animation: gradient 3s ease infinite;
                }
            `}</style>
    </>
);
}
