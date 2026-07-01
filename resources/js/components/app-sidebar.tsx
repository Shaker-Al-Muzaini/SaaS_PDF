import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
} from '@Shared/components/ui/sidebar';
import { dashboard } from '@/routes';
import { type NavItem } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, Users, CreditCard, XCircle, History } from 'lucide-react';
import AppLogo from './app-logo';
import { useState } from 'react';

export function AppSidebar() {
    const { auth } = usePage().props as any;
    const user = auth?.user;
    const isAdmin = user?.role === 'admin';
    const [cancelling, setCancelling] = useState(false);
    const [cancelled, setCancelled] = useState(false);

    // User navigation items
    const userNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboard(),
            icon: LayoutGrid,
        },
        {
            title: 'History',
            href: '/history',
            icon: History,
        },
    ];

    // Admin navigation items
    const adminNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboard(),
            icon: LayoutGrid,
        },
        {
            title: 'All Users',
            href: '/admin/users',
            icon: Users,
        },
    ];

    const mainNavItems = isAdmin ? adminNavItems : userNavItems;

    const footerNavItems: NavItem[] = [
        {
            title: 'Repository',
            href: 'https://github.com',
            icon: Folder,
        },
        {
            title: 'Documentation',
            href: 'https://laravel.com',
            icon: BookOpen,
        },
    ];

    const handleCancelSubscription = async () => {
        if (!confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.')) {
            return;
        }

        setCancelling(true);
        router.post('/subscription/cancel', {}, {
            onSuccess: () => {
                setCancelled(true);
                alert('Subscription will be cancelled at the end of the billing period');
            },
            onError: () => {
                alert('Failed to cancel subscription');
            },
            onFinish: () => setCancelling(false),
        });
    };

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />

                {/* Plan Information Section - Only for non-admin users */}
                {!isAdmin && user?.plan && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Current Plan</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <div className="px-3 py-2 space-y-3">
                                {/* Plan Card */}
                                <div className="rounded-lg border border-sidebar-border bg-gradient-to-br from-violet-50/50 to-indigo-50/50 dark:from-violet-950/20 dark:to-indigo-950/20 p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CreditCard className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                                        <span className="font-semibold text-sm">{user.plan.name}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground mb-2">
                                        {user.plan.price}/month
                                    </div>

                                    {/* Usage Progress */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">PDFs Used</span>
                                            <span className="font-medium">
                                                {user.pdf_count || 0} / {user.plan.pdf_limit < 0 ? 'Unlimited' : user.plan.pdf_limit}
                                            </span>
                                        </div>
                                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-violet-500 to-indigo-600 transition-all"
                                                style={{ width: `${user.plan.pdf_limit > 0 ? Math.min(((user.pdf_count || 0) / user.plan.pdf_limit) * 100, 100) : 0}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                {user.stripe_subscription_id && (
                                    <button
                                        onClick={handleCancelSubscription}
                                        disabled={cancelling || cancelled}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-950/50 transition-colors"
                                    >
                                        <XCircle className="h-3.5 w-3.5" />
                                        {cancelling ? 'Cancelling...' : cancelled ? 'Cancellation Scheduled' : 'Cancel Subscription'}
                                    </button>
                                )}
                            </div>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
