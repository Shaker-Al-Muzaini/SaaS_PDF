import { router } from '@inertiajs/react';
import { X, AlignLeft, List, Lightbulb, FileText } from 'lucide-react';

type SummaryType = 'default' | 'points' | 'highlights' | 'detailed';

interface SummaryOptionsModalProps {
    show: boolean;
    fileName?: string;
    userPlanSlug: string;
    onClose: () => void;
    onSelect: (type: SummaryType) => void;
}

const summaryOptions = [
    { type: 'default' as const, icon: AlignLeft, title: 'Standard Summary', description: 'Concise overview', color: 'violet', requiredPlan: 'basic' },
    { type: 'points' as const, icon: List, title: 'Bullet Points', description: 'Key points in bullet format', color: 'indigo', requiredPlan: 'basic' },
    { type: 'highlights' as const, icon: Lightbulb, title: 'Key Highlights', description: 'Important highlights', color: 'purple', requiredPlan: 'standard' },
    { type: 'detailed' as const, icon: FileText, title: 'Detailed Analysis', description: 'In-depth summary', color: 'blue', requiredPlan: 'premium' }
];

const planHierarchy: Record<string, number> = { basic: 1, standard: 2, premium: 3 };

export default function SummaryOptionsModal({ show, fileName, userPlanSlug, onClose, onSelect }: SummaryOptionsModalProps) {
    if (!show) return null;

    const canAccess = (requiredPlan: string) => {
        const userLevel = planHierarchy[userPlanSlug] || 1;
        const requiredLevel = planHierarchy[requiredPlan] || 1;
        return userLevel >= requiredLevel;
    };

    const handleClick = (option: typeof summaryOptions[0]) => {
        if (canAccess(option.requiredPlan)) {
            onSelect(option.type);
        } else {
            alert(`This feature requires a ${option.requiredPlan} plan. Please upgrade.`);
            router.visit('/dashboard');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Choose Summary Type</h2>
                            <p className="text-sm text-white/80">{fileName}</p>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/20 transition-colors">
                            <X className="h-6 w-6 text-white" />
                        </button>
                    </div>
                </div>

                {/* Options Grid */}
                <div className="p-8 grid md:grid-cols-2 gap-4">
                    {summaryOptions.map((option) => {
                        const isLocked = !canAccess(option.requiredPlan);
                        return (
                            <button
                                key={option.type}
                                onClick={() => handleClick(option)}
                                className={`group relative flex flex-col p-6 rounded-2xl border-2 text-left transition-all ${
                                    isLocked
                                        ? 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 opacity-70 cursor-not-allowed'
                                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-violet-500 dark:hover:border-violet-500 hover:bg-violet-50/30 dark:hover:bg-violet-950/20'
                                }`}
                            >
                                {/* Badge for Locked Plans */}
                                {isLocked && (
                                    <div className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs font-bold">
                                        {option.requiredPlan.toUpperCase()}
                                    </div>
                                )}

                                {/* Icon Container */}
                                <div className={`inline-flex p-3 rounded-xl mb-4 w-fit ${
                                    isLocked
                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                                        : 'bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 group-hover:scale-105 transition-transform'
                                }`}>
                                    <option.icon className="h-6 w-6" />
                                </div>

                                {/* Title */}
                                <h3 className={`text-lg font-bold mb-1 ${
                                    isLocked
                                        ? 'text-slate-400 dark:text-slate-500'
                                        : 'text-slate-800 dark:text-slate-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors'
                                }`}>
                                    {option.title}
                                </h3>

                                {/* Description */}
                                <p className={`text-sm ${isLocked ? 'text-slate-400/80 dark:text-slate-600' : 'text-slate-500 dark:text-slate-400'}`}>
                                    {option.description}
                                </p>

                                {/* Upgrade Link */}
                                {isLocked && (
                                    <div className="mt-auto pt-3 text-xs font-semibold text-violet-600 dark:text-violet-400 group-hover:underline">
                                        Click to Upgrade
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
