import { createInertiaApp } from '@inertiajs/react';
import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';

// تحديث الاستيرادات لتستخدم الاختصارات الجديدة وعمل كود أنظف
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@Shared/Layouts/app-layout';
import AuthLayout from '@Shared/Layouts/auth-layout';
import SettingsLayout from '@Shared/Layouts/settings/layout';
import { Toaster } from '@Shared/components/ui/sonner';
import { TooltipProvider } from '@Shared/components/ui/tooltip';

const appName = (import.meta.env.VITE_APP_NAME as string) || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: async (name: string) => {
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

        // تحويل الاسم إلى حروف صغيرة لتجنب أي مشاكل في حالة الأحرف (Case Sensitivity)
        const nameLower = name.toLowerCase();

        // تطبيق الـ Layouts بشكل مرن وذكي بناءً على الكلمات المفتاحية بالمسار
        if (nameLower.endsWith('welcome')) {
            component.layout = undefined;
        } else if (nameLower.includes('auth/')) {
            // سيتم الآن تطبيق الـ AuthLayout بشكل صحيح تماماً لصفحات تسجيل الدخول
            component.layout = (p: React.ReactNode) => <AuthLayout>{p}</AuthLayout>;
        } else if (nameLower.includes('settings/')) {
            component.layout = (p: React.ReactNode) => (
                <AppLayout>
                    <SettingsLayout>{p}</SettingsLayout>
                </AppLayout>
            );
        } else {
            // لوحة التحكم وباقي الصفحات الداخلية للتطبيق
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
