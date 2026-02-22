<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as m from '$lib/paraglide/messages';

	let { content, open = $bindable(true) }: { content?: Snippet; open?: boolean } = $props();
</script>

{#if open}
	<aside class="sidebar">
		<section class="sidebar__content">
			{#if content}
				{@render content()}
			{:else}
				<p class="sidebar__empty">{m.sidebar_empty()}</p>
			{/if}
		</section>
	</aside>
{/if}
