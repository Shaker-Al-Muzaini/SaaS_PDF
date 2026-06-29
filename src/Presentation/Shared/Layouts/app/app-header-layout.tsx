import { AppContent } from '../../../../../resources/js/components/app-content';
import { AppHeader } from '../../../../../resources/js/components/app-header';
import { AppShell } from '../../../../../resources/js/components/app-shell';
import type { AppLayoutProps } from '../../../../../resources/js/types';

export default function AppHeaderLayout({
    children,
    breadcrumbs,
}: AppLayoutProps) {
    return (
        <AppShell variant="header">
            <AppHeader breadcrumbs={breadcrumbs} />
            <AppContent variant="header">{children}</AppContent>
        </AppShell>
    );
}
