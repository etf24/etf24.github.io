import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    kit: {
        alias: {
            $common: 'src/_common',
            $rebalance: 'src/rebalance'
        },
        files: {
            lib: 'src/_common/infrastructure/svelte/lib',
            routes: 'src/_common/infrastructure/svelte/routes',
            appTemplate: 'src/_common/infrastructure/svelte/app.html',
            hooks: {
                universal: 'src/_common/infrastructure/svelte/hooks',
                server: 'src/_common/infrastructure/svelte/hooks.server'
            }
        },
        adapter: adapter({
            pages: 'docs',
            assets: 'docs',
            fallback: undefined,
            precompress: false,
            strict: true
        })
    }
};

export default config;
