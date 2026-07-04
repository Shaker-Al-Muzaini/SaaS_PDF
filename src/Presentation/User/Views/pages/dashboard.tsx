import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { CheckCircle2, X, Users, CreditCard, FileText, TrendingUp } from 'lucide-react';


// ترويسة مسار التنقل العلوي للوحة التحكم
export const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

// نموذج بيانات المستخدم الأساسي
export interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    plan?: {
        id: number;
        name: string;
        pdf_limit: number;
    };
}

// نموذج إحصائيات الاستهلاك للمستخدم العادي
export interface UserStats {
    pdfCount: number;
    pdfLimit: number;
    planName: string;
    totalSummaries: number;
}

// نموذج إحصائيات النظام الشاملة للمسؤول (Admin)
export interface AdminStats {
    totalUsers: number;
    activeSubscriptions: number;
    totalPdfs: number;
    plans: Array<{
        id: number;
        name: string;
        slug: string;
        price: number;
        users_count: number;
    }>;
}

// الواجهة الشاملة للبيانات الممررة للمكون (Props)
export interface DashboardProps {
    user: User;
    userStats?: UserStats;
    adminStats?: AdminStats;
    flash?: {
        success?: string;
        error?: string;
    };
}
import React from 'react';

// 1. مكون عرض رسائل النظام التنبيهية (Flash Message Notification)
interface FlashNotificationProps {
    message: string;
    type: 'success' | 'error';
    icon: React.ReactNode;
}

export const FlashNotification: React.FC<FlashNotificationProps> = ({ message, type, icon }) => {
    const isSuccess = type === 'success';
    return (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top duration-300">
            <div className={`px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 ${
                isSuccess ? 'bg-muted text-foreground' : 'bg-destructive text-destructive-foreground'
            }`}>
                {icon}
                <p className="font-semibold">{message}</p>
            </div>
        </div>
    );
};

// 2. مكون بطاقة الإحصائيات الموحد (Stat Card)
interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    children?: React.ReactNode; // مخصص لشريط التقدم إن وُجد
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, children }) => {
    return (
        <div className="rounded-xl border border-sidebar-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-muted text-foreground">
                    {icon}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground font-medium truncate">{title}</p>
                    <p className="text-3xl font-bold tracking-tight mt-1">{value}</p>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default function Dashboard({ user, userStats, adminStats, flash }: DashboardProps) {
    const isAdmin = user.role === 'admin';

        return (
            <>
                <Head title="Dashboard" />

                <div className="w-full flex flex-col gap-6 p-6">

                    {/* نظام الإشعارات الفورية */}
                    {flash?.success && (
                        <FlashNotification
                            message={flash.success}
                            type="success"
                            icon={<CheckCircle2 className="h-6 w-6 text-green-500" />}
                        />
                    )}
                    {flash?.error && (
                        <FlashNotification
                            message={flash.error}
                            type="error"
                            icon={<X className="h-6 w-6 text-red-500" />}
                        />
                    )}

                    {/* ترويسة لوحة التحكم */}
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            {isAdmin ? 'Admin Dashboard' : 'User Dashboard'}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Welcome back to your analytical dashboard overview.
                        </p>
                    </div>

                    {/* شبكة عرض بطاقات الإحصائيات */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {isAdmin && adminStats ? (
                            <>
                                <StatCard title="Total Users" value={adminStats.totalUsers} icon={<Users className="h-6 w-6" />} />
                                <StatCard title="Active Subscriptions" value={adminStats.activeSubscriptions} icon={<CreditCard className="h-6 w-6" />} />
                                <StatCard title="Total PDFs Processed" value={adminStats.totalPdfs} icon={<FileText className="h-6 w-6" />} />
                            </>
                        ) : userStats ? (
                            <>
                                <StatCard title="Current Plan" value={userStats.planName} icon={<CreditCard className="h-6 w-6" />} />

                                <StatCard
                                    title="PDFs This Month"
                                    value={`${userStats.pdfCount} / ${userStats.pdfLimit < 0 ? 'Unlimited' : userStats.pdfLimit}`}
                                    icon={<FileText className="h-6 w-6" />}
                                >
                                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                                        <div
                                            className="h-full bg-primary transition-all duration-500 ease-out"
                                            style={{ width: `${userStats.pdfLimit > 0 ? Math.min((userStats.pdfCount / userStats.pdfLimit) * 100, 100) : 0}%` }}
                                        />
                                    </div>
                                </StatCard>

                                <StatCard title="Total Summaries" value={userStats.totalSummaries} icon={<TrendingUp className="h-6 w-6" />} />
                            </>
                        ) : null}
                    </div>

                    {/* جداول خطط الأسعار والاشتراكات - للمسؤولين فقط */}
                    {isAdmin && adminStats && (
                        <div className="rounded-xl border border-sidebar-border bg-card p-6 shadow-sm">
                            <h2 className="text-xl font-semibold tracking-tight mb-4">Plans Overview</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {adminStats.plans.map((plan) => (
                                    <div key={plan.id} className="p-4 rounded-xl border border-sidebar-border/60 bg-muted/50 hover:bg-muted/80 transition-colors">
                                        <h3 className="font-semibold text-lg text-foreground mb-1">{plan.name}</h3>
                                        <p className="text-2xl font-bold text-foreground mb-3">${plan.price}/mo</p>
                                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-background border text-muted-foreground">
                                        {plan.users_count} {plan.users_count === 1 ? 'user' : 'users'}
                                    </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* قسم الترحيب ورفع الملفات السريع - للمهندسين/المستخدمين */}
                    {!isAdmin && (
                        <div className="rounded-xl border border-sidebar-border bg-card p-8 text-center shadow-sm flex flex-col items-center justify-center">
                            <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">Welcome back, {user.name}!</h2>
                            <p className="text-muted-foreground max-w-md mb-6 text-sm">
                                Ready to summarize your PDFs? Go to the home page to upload and process your documents instantly.
                            </p>
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg hover:opacity-90 active:scale-95 transition-all"
                            >
                                <FileText className="h-5 w-5" />
                                Upload PDF Document
                            </Link>
                        </div>
                    )}

                </div>
            </>
        );


}
