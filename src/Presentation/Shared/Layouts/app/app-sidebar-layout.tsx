import { AppContent } from '../../../../../resources/js/components/app-content';
import { AppShell } from '../../../../../resources/js/components/app-shell';
import { AppSidebar } from '../../../../../resources/js/components/app-sidebar';
import { AppSidebarHeader } from '../../../../../resources/js/components/app-sidebar-header';
import type { AppLayoutProps } from '../../../../../resources/js/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {children}
            </AppContent>
        </AppShell>
    );
}
