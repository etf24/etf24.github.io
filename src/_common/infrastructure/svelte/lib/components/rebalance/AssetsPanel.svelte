<script lang="ts">
    import {Trash2, X} from 'lucide-svelte';
    import type {InvalidFieldMap, UiState} from '$rebalance/presentation/rebalancer-ui-state';
    import type {CurrencyCode} from '$lib/currency.svelte';
    import type {TaxCountryCode} from '$lib/country.svelte';
    import * as m from '$lib/paraglide/messages';

    type AssetField = 'marketValueInput' | 'targetWeightInput' | 'investedCapitalInput';
    type EditableField = 'name' | AssetField;
    type MoneyField = 'marketValue' | 'investedCapital';

    let {
        state,
        invalidFields,
        currencyCode,
        taxCountryCode,
        onUpdateAssetDraft,
        onCommitAssetPatch,
        onAddAsset,
        onRemoveAsset,
        onClearField,
        onFieldFocus,
        onFieldBlur,
        onMoneyFocus,
        onMoneyBlur,
        displayMoneyInput
    }: {
        state: UiState;
        invalidFields: InvalidFieldMap;
        currencyCode: CurrencyCode;
        taxCountryCode: TaxCountryCode;
        onUpdateAssetDraft: (assetId: string, patch: Partial<UiState['assets'][number]>) => void;
        onCommitAssetPatch: (assetId: string, patch: Partial<UiState['assets'][number]>) => void;
        onAddAsset: () => void;
        onRemoveAsset: (assetId: string) => void;
        onClearField: (assetId: string, field: AssetField) => void;
        onFieldFocus: (assetId: string, field: EditableField) => void;
        onFieldBlur: (assetId: string, field: EditableField) => void;
        onMoneyFocus: (assetId: string, field: MoneyField) => void;
        onMoneyBlur: () => void;
        displayMoneyInput: (assetId: string, field: MoneyField, rawValue: string) => string;
    } = $props();

    function hasInvalidField(assetId: string): boolean {
        return Boolean(invalidFields[assetId] && Object.keys(invalidFields[assetId]).length > 0);
    }

    function fieldIsInvalid(assetId: string, field: 'marketValue' | 'targetWeight' | 'investedCapital'): boolean {
        return Boolean(invalidFields[assetId]?.[field]);
    }

    function currencyUnitSuffix(): string {
        if (currencyCode === 'EUR') {
            return ' (€)';
        }

        if (currencyCode === 'USD') {
            return ' ($)';
        }

        return '';
    }

    function withCurrencyUnit(label: string): string {
        return `${label}${currencyUnitSuffix()}`;
    }
</script>

<article class="rebalancer-panel rebalancer-panel--assets">
    <header class="rebalancer-panel__header">
        <h2 class="rebalancer-panel__title">{m.page_rebalancer_assets()}</h2>
    </header>

    <ul class="asset-list">
        {#each state.assets as asset}
            <li class="asset-card {hasInvalidField(asset.id) ? 'asset-card--invalid' : ''}">
                <header class="asset-card__header">
                    <span class="asset-chip {asset.colorToken}"></span>
                    <input
                        class="asset-card__name"
                        value={asset.name}
                        placeholder={asset.label}
                        oninput={(event) =>
                            onUpdateAssetDraft(asset.id, {name: (event.currentTarget as HTMLInputElement).value})}
                        onfocus={() => onFieldFocus(asset.id, 'name')}
                        onblur={() => onFieldBlur(asset.id, 'name')}
                    />
                    <button
                        class="asset-card__remove asset-card__remove--danger"
                        onclick={() => onRemoveAsset(asset.id)}
                        aria-label={m.page_rebalancer_remove_asset()}
                    >
                        <Trash2 size={14} />
                    </button>
                </header>

                <fieldset class="asset-card__fields">
                    <fieldset class="form-field">
                        <p class="form-field__label">{withCurrencyUnit(m.page_rebalancer_field_market_value())}</p>
                        <div class="input-with-clear">
                            <input
                                class="form-field__input {fieldIsInvalid(asset.id, 'marketValue') ? 'form-field__input--invalid' : ''}"
                                value={displayMoneyInput(asset.id, 'marketValue', asset.marketValueInput)}
                                oninput={(event) =>
                                    onUpdateAssetDraft(asset.id, {marketValueInput: (event.currentTarget as HTMLInputElement).value})}
                                onfocus={() => {
                                    onFieldFocus(asset.id, 'marketValueInput');
                                    onMoneyFocus(asset.id, 'marketValue');
                                }}
                                onblur={() => {
                                    onMoneyBlur();
                                    onFieldBlur(asset.id, 'marketValueInput');
                                }}
                            />
                            {#if asset.marketValueInput !== ''}
                                <button
                                    class="input-with-clear__button"
                                    onclick={() => onClearField(asset.id, 'marketValueInput')}
                                    aria-label={m.page_rebalancer_clear_field()}
                                ><X size={14} /></button>
                            {/if}
                        </div>
                    </fieldset>

                    <fieldset class="form-field">
                        <p class="form-field__label">{m.page_rebalancer_field_target_weight()}</p>
                        <div class="input-with-clear">
                            <input
                                class="form-field__input {fieldIsInvalid(asset.id, 'targetWeight') ? 'form-field__input--invalid' : ''}"
                                value={asset.targetWeightInput}
                                oninput={(event) =>
                                    onUpdateAssetDraft(asset.id, {targetWeightInput: (event.currentTarget as HTMLInputElement).value})}
                                onfocus={() => onFieldFocus(asset.id, 'targetWeightInput')}
                                onblur={() => onFieldBlur(asset.id, 'targetWeightInput')}
                            />
                            {#if asset.targetWeightInput !== ''}
                                <button
                                    class="input-with-clear__button"
                                    onclick={() => onClearField(asset.id, 'targetWeightInput')}
                                    aria-label={m.page_rebalancer_clear_field()}
                                ><X size={14} /></button>
                            {/if}
                        </div>
                    </fieldset>

                    <fieldset class="form-field">
                        <p class="form-field__label">{withCurrencyUnit(m.page_rebalancer_field_invested_capital())}</p>
                        <div class="input-with-clear">
                            <input
                                class="form-field__input {fieldIsInvalid(asset.id, 'investedCapital') ? 'form-field__input--invalid' : ''}"
                                value={displayMoneyInput(asset.id, 'investedCapital', asset.investedCapitalInput)}
                                oninput={(event) =>
                                    onUpdateAssetDraft(asset.id, {
                                        investedCapitalInput: (event.currentTarget as HTMLInputElement).value
                                    })}
                                onfocus={() => {
                                    onFieldFocus(asset.id, 'investedCapitalInput');
                                    onMoneyFocus(asset.id, 'investedCapital');
                                }}
                                onblur={() => {
                                    onMoneyBlur();
                                    onFieldBlur(asset.id, 'investedCapitalInput');
                                }}
                            />
                            {#if asset.investedCapitalInput !== ''}
                                <button
                                    class="input-with-clear__button"
                                    onclick={() => onClearField(asset.id, 'investedCapitalInput')}
                                    aria-label={m.page_rebalancer_clear_field()}
                                ><X size={14} /></button>
                            {/if}
                        </div>
                    </fieldset>

                    {#if taxCountryCode === 'DEU'}
                        <fieldset class="form-field">
                            <p class="form-field__label">{m.page_rebalancer_field_partial_exemption()}</p>
                            <select
                                class="form-field__input"
                                value={asset.partialExemption}
                                onchange={(event) =>
                                    onCommitAssetPatch(asset.id, {
                                        partialExemption: Number((event.currentTarget as HTMLSelectElement).value) as 0 | 15 | 30
                                    })}
                            >
                                <option value={0} selected={asset.partialExemption === 0}>0</option>
                                <option value={15} selected={asset.partialExemption === 15}>15</option>
                                <option value={30} selected={asset.partialExemption === 30}>30</option>
                            </select>
                        </fieldset>
                    {/if}
                </fieldset>
            </li>
        {/each}
    </ul>

    <button class="asset-add-button" onclick={onAddAsset} disabled={state.assets.length >= 10}>
        + {m.page_rebalancer_add_asset()}
    </button>
</article>
