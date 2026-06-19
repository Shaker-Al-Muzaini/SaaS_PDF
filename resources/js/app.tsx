import { createInertiaApp } from '@inertiajs/react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';

// سطر فارغ إجباري هنا حل المشكلة الأولى
const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) => {
        const pages = import.meta.glob('../../src/Presentation/**/*.tsx', { eager: true });
        const page = pages[`../../src/Presentation/${name}.tsx`] as any;

        const  component = page?.default ?? page;

        // 👇 هنا تحط اللوجيك تبع layout
        if (name.endsWith('welcome')) {
            component.layout = undefined;
        } else if (name.includes('/Views/pages/auth/')) {
            component.layout = (page: any) => <AuthLayout>{page}</AuthLayout>;
        } else if (name.includes('/Views/pages/settings/')) {
            component.layout = (page: any) => (
                <AppLayout>
                    <SettingsLayout>{page}</SettingsLayout>
                </AppLayout>
            );
        } else {
            component.layout = (page: any) => <AppLayout>{page}</AppLayout>;
        }

        return component;
    },
    layout: (name) => {
        switch (true) {
            case name.endsWith('welcome'):
                return null;
            case name.includes('/Views/pages/auth/'):
                return AuthLayout;
            case name.includes('/Views/pages/settings/'):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

initializeTheme();
