<script lang="ts">
    import {applyTaxCountryCode, taxCountry, type TaxCountryCode} from '$lib/country.svelte';
    import * as m from '$lib/paraglide/messages';

    const options: Array<{value: TaxCountryCode; label: () => string}> = [
        {value: 'NONE', label: () => m.settings_tax_country_none()},
        {value: 'DEU', label: () => m.settings_tax_country_deu()}
    ];

    function changeCountry(event: Event): void {
        applyTaxCountryCode((event.currentTarget as HTMLSelectElement).value as TaxCountryCode);
    }
</script>

<fieldset class="form-field">
    <label class="form-field__label">
        {m.settings_tax_country()}
        <select class="form-field__input" bind:value={taxCountry.code} onchange={changeCountry}>
            {#each options as option}
                <option value={option.value}>{option.label()}</option>
            {/each}
        </select>
    </label>
</fieldset>
