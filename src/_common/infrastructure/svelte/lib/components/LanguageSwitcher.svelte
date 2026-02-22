<script lang="ts">
    import {applyLanguageMode, lang, type LanguageMode} from '$lib/lang.svelte';
    import * as m from '$lib/paraglide/messages';

    const options: Array<{value: LanguageMode; label: () => string}> = [
        {value: 'en', label: () => m.settings_language_english()},
        {value: 'auto', label: () => m.settings_language_auto()},
        {value: 'de', label: () => m.settings_language_german()},
    ];

    function switchTo(mode: LanguageMode): void {
        applyLanguageMode(mode);
    }
</script>

<fieldset class="form-field">
    <legend class="form-field__label">{m.settings_language()}</legend>
    <nav class="segmented-control">
        {#each options as option}
            <button
                class="segmented-control__button {lang.mode === option.value ? 'segmented-control__button--active' : ''}"
                onclick={() => switchTo(option.value)}
            >
                {option.label()}
            </button>
        {/each}
    </nav>
</fieldset>
