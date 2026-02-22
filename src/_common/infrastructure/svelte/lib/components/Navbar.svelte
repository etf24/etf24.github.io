<script lang="ts">
	import { page } from '$app/state';
	import { CircleHelp, Scale } from 'lucide-svelte';
	import { APP_VERSION } from '$lib/config/app-metadata';
	import * as m from '$lib/paraglide/messages';

	const navItems: { href: string; labelKey: keyof typeof m; icon: typeof Scale | typeof CircleHelp }[] = [
		{ href: '/rebalance', labelKey: 'nav_rebalance', icon: Scale },
		{ href: '/about', labelKey: 'nav_about', icon: CircleHelp }
	];

	function isActive(href: string): boolean {
		if (href === '/rebalance') return page.url.pathname === '/rebalance';
		return page.url.pathname.startsWith(href);
	}
</script>

<nav class="navbar">
	<a href="/rebalance" class="navbar__brand" data-no-translate data-sveltekit-preload-data="hover">{m.app_title()}</a>
	<p class="navbar__status">{m.navbar_unstable_badge()}</p>

	<ul class="navbar__menu">
		{#each navItems as item}
			<li class="navbar__item">
				<a
					href={item.href}
					class="navbar__link {isActive(item.href) ? 'navbar__link--active' : ''}"
					data-no-translate
					data-sveltekit-preload-data="hover"
				>
					<span class="navbar__icon"><item.icon size={24} /></span>
					<span class="navbar__label">{m[item.labelKey]()}</span>
				</a>
			</li>
		{/each}
	</ul>

	<p class="navbar__version">v{APP_VERSION}</p>
</nav>
