import {paraglide} from '@inlang/paraglide-sveltekit/vite';
import {sveltekit} from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import {SvelteKitPWA} from '@vite-pwa/sveltekit';
import {defineConfig} from 'vite';
import {readFileSync} from 'node:fs';

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf-8')) as {
    version: string;
};
const APP_VERSION = packageJson.version;

export default defineConfig({
    define: {
        __APP_VERSION__: JSON.stringify(APP_VERSION)
    },
    plugins: [
        paraglide({
            project: './frameworks/inlang/project.inlang',
            outdir: './src/_common/infrastructure/svelte/lib/paraglide'
        }),
        tailwindcss(),
        sveltekit(),
        SvelteKitPWA({
            registerType: 'autoUpdate',
            manifest: {
                name: 'etf24 – Portfolio Analyzer',
                short_name: 'etf24',
                description: 'Client-side portfolio analysis: CSV import, charts, Monte Carlo, backtesting',
                theme_color: '#1e293b',
                background_color: '#0f172a',
                display: 'standalone',
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
            }
        })
    ]
});
