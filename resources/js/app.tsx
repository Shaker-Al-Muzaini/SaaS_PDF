import { createInertiaApp } from '@inertiajs/react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';
import React from 'react';

const appName = (import.meta.env.VITE_APP_NAME as string) || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: async (name: string) => {
        // تحديد نوع المصفوفة لـ Vite Glob
        const srcPages = import.meta.glob<any>('../../src/Presentation/**/*.tsx');
        const defaultPages = import.meta.glob<any>('./Pages/**/*.tsx');

        let page: any;
        let path: string;

        if (name.includes('Views/')) {
            path = `../../src/Presentation/${name}.tsx`;
            if (!srcPages[path]) throw new Error(`DDD Page not found: ${path}`);
            page = await srcPages[path]();
        } else {
            path = `./Pages/${name}.tsx`;
            if (!defaultPages[path]) throw new Error(`Default Page not found: ${path}`);
            page = await defaultPages[path]();
        }

        const component = page?.default ?? page;

        // تطبيق الـ Layouts مع تجنب أخطاء النوع
        if (name.endsWith('welcome') || name.endsWith('Welcome')) {
            component.layout = undefined;
        } else if (name.includes('/Views/pages/auth/')) {
            component.layout = (p: React.ReactNode) => <AuthLayout>{p}</AuthLayout>;
        } else if (name.includes('/Views/pages/settings/')) {
            component.layout = (p: React.ReactNode) => (
                <AppLayout>
                    <SettingsLayout>{p}</SettingsLayout>
                </AppLayout>
            );
        } else {
            component.layout = (p: React.ReactNode) => <AppLayout>{p}</AppLayout>;
        }

        return component;
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
