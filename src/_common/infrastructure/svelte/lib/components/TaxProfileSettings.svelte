<script lang="ts">
    import {taxCountry} from '$lib/country.svelte';
    import {currency} from '$lib/currency.svelte';
    import {formatNumericInputForBlur, stripGroupingSeparators} from '$lib/formatting/input-format';
    import {X} from 'lucide-svelte';
    import {globalTaxProfile, updateGlobalTaxProfile} from '$lib/tax-profile.svelte';
    import * as m from '$lib/paraglide/messages';

    let allowanceInputFocused = false;

    function normalizeNumericInput(value: string): string {
        return value.replace(',', '.');
    }

    function currencyUnitSuffix(): string {
        if (currency.code === 'EUR') {
            return ' (€)';
        }

        if (currency.code === 'USD') {
            return ' ($)';
        }

        return '';
    }

    function displayAllowanceInput(): string {
        if (allowanceInputFocused) {
            return globalTaxProfile.remainingSparerPauschbetragInput;
        }

        return formatNumericInputForBlur(globalTaxProfile.remainingSparerPauschbetragInput);
    }
</script>

{#if taxCountry.code === 'DEU'}
    <fieldset class="settings-panel__controls">
        <fieldset class="form-field">
            <p class="form-field__label">{m.page_rebalancer_tax_capital_gains()}</p>
            <div class="input-with-clear">
                <input
                    class="form-field__input"
                    value={globalTaxProfile.capitalGainsTaxInput}
                    oninput={(event) =>
                        updateGlobalTaxProfile({
                            capitalGainsTaxInput: normalizeNumericInput((event.currentTarget as HTMLInputElement).value)
                        })}
                />
                {#if globalTaxProfile.capitalGainsTaxInput !== ''}
                    <button
                        class="input-with-clear__button"
                        onclick={() => updateGlobalTaxProfile({capitalGainsTaxInput: ''})}
                        aria-label={m.page_rebalancer_clear_field()}
                    ><X size={14} /></button>
                {/if}
            </div>
        </fieldset>

        <fieldset class="form-field">
            <p class="form-field__label">{m.page_rebalancer_tax_solidarity()}</p>
            <div class="input-with-clear">
                <input
                    class="form-field__input"
                    value={globalTaxProfile.solidaritySurchargeInput}
                    oninput={(event) =>
                        updateGlobalTaxProfile({
                            solidaritySurchargeInput: normalizeNumericInput((event.currentTarget as HTMLInputElement).value)
                        })}
                />
                {#if globalTaxProfile.solidaritySurchargeInput !== ''}
                    <button
                        class="input-with-clear__button"
                        onclick={() => updateGlobalTaxProfile({solidaritySurchargeInput: ''})}
                        aria-label={m.page_rebalancer_clear_field()}
                    ><X size={14} /></button>
                {/if}
            </div>
        </fieldset>

        <fieldset class="form-field">
            <p class="form-field__label">{m.page_rebalancer_tax_church()}</p>
            <div class="input-with-clear">
                <input
                    class="form-field__input"
                    value={globalTaxProfile.churchTaxInput}
                    oninput={(event) =>
                        updateGlobalTaxProfile({
                            churchTaxInput: normalizeNumericInput((event.currentTarget as HTMLInputElement).value)
                        })}
                />
                {#if globalTaxProfile.churchTaxInput !== ''}
                    <button
                        class="input-with-clear__button"
                        onclick={() => updateGlobalTaxProfile({churchTaxInput: ''})}
                        aria-label={m.page_rebalancer_clear_field()}
                    ><X size={14} /></button>
                {/if}
            </div>
        </fieldset>

        <fieldset class="form-field">
            <p class="form-field__label">{m.page_rebalancer_tax_allowance_remaining()}{currencyUnitSuffix()}</p>
            <div class="input-with-clear">
                <input
                    class="form-field__input"
                    value={displayAllowanceInput()}
                    oninput={(event) =>
                        updateGlobalTaxProfile({
                            remainingSparerPauschbetragInput: normalizeNumericInput(
                                stripGroupingSeparators((event.currentTarget as HTMLInputElement).value)
                            )
                        })}
                    onfocus={() => {
                        allowanceInputFocused = true;
                    }}
                    onblur={() => {
                        allowanceInputFocused = false;
                    }}
                />
                {#if globalTaxProfile.remainingSparerPauschbetragInput !== ''}
                    <button
                        class="input-with-clear__button"
                        onclick={() => updateGlobalTaxProfile({remainingSparerPauschbetragInput: ''})}
                        aria-label={m.page_rebalancer_clear_field()}
                    ><X size={14} /></button>
                {/if}
            </div>
        </fieldset>
    </fieldset>
{/if}
