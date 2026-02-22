<script lang="ts">
    import {applyResultRoundingEnabled, resultRounding} from '$lib/result-rounding.svelte';
    import * as m from '$lib/paraglide/messages';
</script>

<fieldset class="form-field">
    <legend class="form-field__label">{m.settings_result_rounding()}</legend>
    <nav class="segmented-control">
        <button
            class="segmented-control__button {resultRounding.enabled ? '' : 'segmented-control__button--active'}"
            onclick={() => applyResultRoundingEnabled(false)}
        >
            {m.settings_toggle_off()}
        </button>
        <button
            class="segmented-control__button {resultRounding.enabled ? 'segmented-control__button--active' : ''}"
            onclick={() => applyResultRoundingEnabled(true)}
        >
            {m.settings_toggle_on()}
        </button>
    </nav>
</fieldset>
