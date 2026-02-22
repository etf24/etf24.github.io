<script lang="ts">
    import {applyCurrencyCode, currency, type CurrencyCode} from '$lib/currency.svelte';
    import * as m from '$lib/paraglide/messages';

    const options: Array<{value: CurrencyCode; label: () => string}> = [
        {value: 'NONE', label: () => m.settings_currency_none()},
        {value: 'EUR', label: () => m.settings_currency_eur()},
        {value: 'USD', label: () => m.settings_currency_usd()}
    ];

    function changeCurrency(event: Event): void {
        applyCurrencyCode((event.currentTarget as HTMLSelectElement).value as CurrencyCode);
    }
</script>

<fieldset class="form-field">
    <label class="form-field__label">
        {m.settings_currency()}
        <select class="form-field__input" bind:value={currency.code} onchange={changeCurrency}>
            {#each options as option}
                <option value={option.value}>{option.label()}</option>
            {/each}
        </select>
    </label>
</fieldset>
