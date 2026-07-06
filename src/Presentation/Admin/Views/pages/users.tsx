import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Users, CreditCard, FileText, Calendar, RefreshCw } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'All Users',
        href: '/admin/users',
    },
];

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    created_at: string;
    pdf_count: number;
    pdf_summaries_count: number;
    plan?: {
        name: string;
        price: number | string;
        pdf_limit: number;
    } | null;
}

interface Props {
    users: {
        data: User[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    total_users_count?: number;
    active_subscriptions_count?: number;
    total_pdfs_count?: number;
}

export default function AdminUsers({ users, total_users_count = 0, active_subscriptions_count = 0, total_pdfs_count = 0 }: Props) {
    const [changingPlan, setChangingPlan] = useState<number | null>(null);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <>
            <Head title="User Management" />

            {/* تم تنظيف الكلاسات لتجنب التمرير المزدوج والتداخل العلوي */}
            <div className="p-4 md:p-6 space-y-6 w-full h-auto">

                {/* العنوان والوصف النصي القصير */}
                <div className="space-y-1">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">User Management</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage all users and their subscription plans
                    </p>
                </div>

                {/* قسم بطاقات الإحصائيات */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="flex items-center gap-4 rounded-xl border border-sidebar-border bg-background p-5 shadow-sm">
                        <div className="p-2 bg-muted rounded-lg">
                            <Users className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Users</p>
                            <h3 className="text-xl md:text-2xl font-bold text-foreground mt-0.5">{total_users_count || users.total}</h3>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 rounded-xl border border-sidebar-border bg-background p-5 shadow-sm">
                        <div className="p-2 bg-muted rounded-lg">
                            <CreditCard className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Subscriptions</p>
                            <h3 className="text-xl md:text-2xl font-bold text-foreground mt-0.5">{active_subscriptions_count}</h3>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 rounded-xl border border-sidebar-border bg-background p-5 shadow-sm sm:col-span-2 lg:col-span-1">
                        <div className="p-2 bg-muted rounded-lg">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total PDFs Processed</p>
                            <h3 className="text-xl md:text-2xl font-bold text-foreground mt-0.5">{total_pdfs_count}</h3>
                        </div>
                    </div>
                </div>

                {/* جدول البيانات الرئيسي */}
                <div className="bg-background rounded-xl border border-sidebar-border shadow-sm overflow-hidden">
                    <div className="overflow-x-auto w-full">
                        <table className="min-w-full divide-y divide-sidebar-border table-auto">
                            <thead className="bg-muted/50">
                            <tr>
                                <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                                <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Current Plan</th>
                                <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Usage</th>
                                <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Total PDFs</th>
                                <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Joined</th>
                            </tr>
                            </thead>

                            <tbody className="divide-y divide-sidebar-border">
                            {users.data.map((user) => (
                                <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <div className="font-semibold text-foreground text-sm">{user.name}</div>
                                            <div className="text-xs text-muted-foreground">{user.email}</div>
                                            {user.role === 'admin' && (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground mt-1 w-max">
                                                        Admin
                                                    </span>
                                            )}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {user.plan ? (
                                            <div className="flex flex-col">
                                                <div className="font-semibold text-foreground text-sm">{user.plan.name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    ${Number(user.plan.price).toFixed(2)}/month
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">No plan</span>
                                        )}
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {user.plan && (
                                            <div className="space-y-1">
                                                <div className="text-xs text-foreground font-medium">
                                                    {user.pdf_count || 0} / {user.plan.pdf_limit}
                                                </div>
                                                <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary"
                                                        style={{
                                                            width: `${Math.min(((user.pdf_count || 0) / user.plan.pdf_limit) * 100, 100)}%`
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-sm text-foreground">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            <span>{user.pdf_summaries_count || 0}</span>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Calendar className="h-3.5 w-3.5" />
                                            <span>{formatDate(user.created_at)}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {users.last_page > 1 && (
                        <div className="px-6 py-4 border-t border-sidebar-border flex items-center justify-between bg-background">
                            <div className="text-xs text-muted-foreground">
                                Showing {((users.current_page - 1) * users.per_page) + 1} to {Math.min(users.current_page * users.per_page, users.total)} of {users.total} users
                            </div>

                            <div className="flex items-center gap-1.5">
                                {Array.from({ length: users.last_page }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => router.visit(`/admin/users?page=${page}`)}
                                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                                            page === users.current_page
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted hover:bg-accent'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
