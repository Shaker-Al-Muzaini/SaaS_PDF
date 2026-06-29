import inertia from '@inertiajs/vite';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { bunny } from 'laravel-vite-plugin/fonts';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    resolve: {
        alias: {
            // تم تعديل هذا السطر ليوجه إلى مجلد الموارد الفعلي js بدلاً من src
            '@': path.resolve(__dirname, './resources/js'),
            '@Presentation': path.resolve(__dirname, './src/Presentation'),
            '@Shared': path.resolve(__dirname, './src/Presentation/Shared'), // الاختصار الجديد
            '@shared': path.resolve(__dirname, './src/Presentation/Shared'), // اختصار إضافي بالصغير للاحتياط
        },
    },
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
            fonts: [
                bunny('Instrument Sans', {
                    weights:[400, 500, 600],
                }),
            ],
        }),
        inertia(),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
    ],
});
