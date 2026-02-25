<script lang="ts">
	import '../app.css';
	import faviconDark from '$lib/assets/favicon-dark.svg';
	import faviconLight from '$lib/assets/favicon-light.svg';
	import { onMount } from 'svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';
	import CurrencySwitcher from '$lib/components/CurrencySwitcher.svelte';
	import CountrySwitcher from '$lib/components/CountrySwitcher.svelte';
	import ResultRoundingToggle from '$lib/components/ResultRoundingToggle.svelte';
	import TaxProfileSettings from '$lib/components/TaxProfileSettings.svelte';
	import { lang } from '$lib/lang.svelte';
	import { browser } from '$app/environment';
	import { PanelRightClose, PanelRightOpen } from 'lucide-svelte';
	import { ParaglideJS } from '@inlang/paraglide-sveltekit';
	import { i18n } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages';

	let { children } = $props();
	let activeFavicon = $state(faviconDark);

	let sidebarOpen = $state(browser ? localStorage.getItem('sidebar-open') !== 'false' : false);
	let touchStartX = 0;
	let touchCurrentX = 0;
	let touchTracking = false;

	function syncFaviconToThemeClass(): void {
		if (!browser) {
			return;
		}

		activeFavicon = document.documentElement.classList.contains('dark') ? faviconDark : faviconLight;
	}

	$effect(() => {
		if (browser) localStorage.setItem('sidebar-open', String(sidebarOpen));
	});

	onMount(() => {
		syncFaviconToThemeClass();

		const observer = new MutationObserver(() => {
			syncFaviconToThemeClass();
		});

		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['class']
		});

		return () => {
			observer.disconnect();
		};
	});

	function handleTouchStart(event: TouchEvent): void {
		if (!browser || window.innerWidth > 1024) {
			return;
		}
		touchTracking = true;
		touchStartX = event.touches[0].clientX;
		touchCurrentX = touchStartX;
	}

	function handleTouchMove(event: TouchEvent): void {
		if (!touchTracking) {
			return;
		}
		touchCurrentX = event.touches[0].clientX;
	}

	function handleTouchEnd(): void {
		if (!touchTracking) {
			return;
		}

		const deltaX = touchCurrentX - touchStartX;
		const startedNearRightEdge = touchStartX > window.innerWidth - 36;

		if (!sidebarOpen && startedNearRightEdge && deltaX < -42) {
			sidebarOpen = true;
		}

		if (sidebarOpen && deltaX > 42) {
			sidebarOpen = false;
		}

		touchTracking = false;
	}

	function toggleSidebar(): void {
		sidebarOpen = !sidebarOpen;
	}

	function handleSidebarRailKeydown(event: KeyboardEvent): void {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			toggleSidebar();
		}
	}
</script>

<svelte:head>
	<link rel="icon" href={activeFavicon} />
</svelte:head>

<ParaglideJS {i18n} languageTag={lang.current}>
	<section
		class="app-layout"
		role="presentation"
		ontouchstart={handleTouchStart}
		ontouchmove={handleTouchMove}
		ontouchend={handleTouchEnd}
	>
		<Navbar />

		<main class="app-layout__main">
			{@render children()}
		</main>

		<Sidebar content={globalSettings} bind:open={sidebarOpen} />

		<button
			class="sidebar-rail"
			aria-label={sidebarOpen ? m.sidebar_toggle_hide() : m.sidebar_toggle_show()}
			title={sidebarOpen ? m.sidebar_toggle_hide() : m.sidebar_toggle_show()}
			onclick={toggleSidebar}
			onkeydown={handleSidebarRailKeydown}
			type="button"
		>
			{#if sidebarOpen}
				<PanelRightClose size={16} />
			{:else}
				<PanelRightOpen size={16} />
			{/if}
		</button>
	</section>
</ParaglideJS>

{#snippet globalSettings()}
	<section class="settings-panel">
		<h2 class="settings-panel__title">{m.sidebar_global_settings_title()}</h2>
		<ThemeToggle />
		<LanguageSwitcher />
		<CurrencySwitcher />
		<ResultRoundingToggle />
		<CountrySwitcher />
		<TaxProfileSettings />
	</section>
{/snippet}
