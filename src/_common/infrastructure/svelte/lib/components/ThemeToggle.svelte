<script lang="ts">
	import { browser } from '$app/environment';
	import * as m from '$lib/paraglide/messages';

	type Theme = 'dark' | 'auto' | 'light';

	let theme = $state<Theme>(browser ? (localStorage.getItem('theme') as Theme) || 'auto' : 'auto');

	function applyTheme(t: Theme) {
		const prefersDark = matchMedia('(prefers-color-scheme: dark)').matches;
		const isDark = t === 'dark' || (t === 'auto' && prefersDark);
		document.documentElement.classList.toggle('dark', isDark);
	}

	function setTheme(t: Theme) {
		theme = t;
		localStorage.setItem('theme', t);
		applyTheme(t);
	}

	if (browser) {
		matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
			if (theme === 'auto') applyTheme('auto');
		});
	}

	const options: { value: Theme; label: () => string }[] = [
		{ value: 'dark', label: () => m.settings_theme_dark() },
		{ value: 'auto', label: () => m.settings_theme_auto() },
		{ value: 'light', label: () => m.settings_theme_light() },
	];
</script>

<fieldset class="form-field">
	<legend class="form-field__label">{m.settings_theme()}</legend>
	<nav class="segmented-control">
		{#each options as opt}
			<button
				class="segmented-control__button {theme === opt.value ? 'segmented-control__button--active' : ''}"
				onclick={() => setTheme(opt.value)}
			>
				{opt.label()}
			</button>
		{/each}
	</nav>
</fieldset>
