<script lang="ts">
    import {browser} from '$app/environment';
    import {Undo2} from 'lucide-svelte';
    import {currency} from '$lib/currency.svelte';
    import {taxCountry} from '$lib/country.svelte';
    import {resultRounding} from '$lib/result-rounding.svelte';
    import {globalTaxProfile} from '$lib/tax-profile.svelte';
    import {formatMoney, formatPercent} from '$lib/formatting/result-format';
    import {formatNumericInputForBlur, stripGroupingSeparators} from '$lib/formatting/input-format';
    import AssetsPanel from '$lib/components/rebalance/AssetsPanel.svelte';
    import DistributionPanel from '$lib/components/rebalance/DistributionPanel.svelte';
    import OptionsPanel from '$lib/components/rebalance/OptionsPanel.svelte';
    import * as m from '$lib/paraglide/messages';
    import {
        createDefaultUiState,
        createHistoryState,
        createNextAsset,
        hideUndoToast,
        loadUiState,
        normalizeNumericInput,
        restoreSnapshot,
        saveUiState,
        scheduleSnapshot,
        showUndoToast,
        toAllocationRows,
        toOptionActionRows,
        toOverview
    } from '$rebalance/presentation/rebalancer-ui-state';

    let state = browser ? loadUiState() : createDefaultUiState();
    const history = createHistoryState();

    let invalidFields = {} as Record<string, Partial<Record<'marketValue' | 'targetWeight' | 'investedCapital', boolean>>>;
    let overview = toOverview(state, {
        taxCountry: taxCountry.code,
        capitalGainsTaxInput: globalTaxProfile.capitalGainsTaxInput,
        solidaritySurchargeInput: globalTaxProfile.solidaritySurchargeInput,
        churchTaxInput: globalTaxProfile.churchTaxInput,
        remainingSparerPauschbetragInput: globalTaxProfile.remainingSparerPauschbetragInput
    }).overview;
    let allocationRows = toAllocationRows(state);
    let optionACashActions = toOptionActionRows([], state.assets);
    let optionBTradeActions = toOptionActionRows([], state.assets);
    let selectedOption: 'A' | 'B' = 'A';
    let saveTimer: number | null = null;
    let focusedNumericField: string | null = null;

    recalculate();

    function recalculate(): void {
        const mapped = toOverview(state, {
            taxCountry: taxCountry.code,
            capitalGainsTaxInput: globalTaxProfile.capitalGainsTaxInput,
            solidaritySurchargeInput: globalTaxProfile.solidaritySurchargeInput,
            churchTaxInput: globalTaxProfile.churchTaxInput,
            remainingSparerPauschbetragInput: globalTaxProfile.remainingSparerPauschbetragInput
        });

        overview = mapped.overview;
        invalidFields = mapped.invalidFields;
        allocationRows = toAllocationRows(state);

        optionACashActions = overview ? toOptionActionRows(overview.optionA_cashOnly.actions, state.assets) : [];
        optionBTradeActions = overview ? toOptionActionRows(overview.optionB_tradeRebalance.actions, state.assets) : [];
    }

    function scheduleSave(): void {
        if (!browser) {
            return;
        }

        if (saveTimer !== null) {
            clearTimeout(saveTimer);
        }

        saveTimer = window.setTimeout(() => {
            saveUiState(state);
            saveTimer = null;
        }, 300);
    }

    function sanitizeAssetPatch(
        patch: Partial<{
            name: string;
            marketValueInput: string;
            targetWeightInput: string;
            investedCapitalInput: string;
            partialExemption: 0 | 15 | 30;
        }>
    ) {
        const sanitized: Partial<typeof state.assets[number]> = {};

        if (patch.name !== undefined) {
            sanitized.name = patch.name;
        }

        if (patch.partialExemption !== undefined) {
            sanitized.partialExemption = patch.partialExemption;
        }

        if (patch.marketValueInput !== undefined) {
            sanitized.marketValueInput = normalizeNumericInput(stripGroupingSeparators(patch.marketValueInput));
        }

        if (patch.targetWeightInput !== undefined) {
            sanitized.targetWeightInput = normalizeNumericInput(stripGroupingSeparators(patch.targetWeightInput));
        }

        if (patch.investedCapitalInput !== undefined) {
            sanitized.investedCapitalInput = normalizeNumericInput(stripGroupingSeparators(patch.investedCapitalInput));
        }

        return sanitized;
    }

    function updateAsset(assetId: string, patch: Partial<typeof state.assets[number]>): void {
        scheduleSnapshot(history, state);
        const sanitized = sanitizeAssetPatch(patch);

        state = {
            ...state,
            assets: state.assets.map((asset: typeof state.assets[number]) => (asset.id === assetId ? {...asset, ...sanitized} : asset))
        };

        recalculate();
        scheduleSave();
    }

    function addAsset(): void {
        if (state.assets.length >= 10) {
            return;
        }

        scheduleSnapshot(history, state);

        const draft = {
            ...state,
            assets: [...state.assets]
        };

        draft.assets.push(createNextAsset(draft));
        state = draft;

        recalculate();
        scheduleSave();
    }

    function removeAsset(assetId: string): void {
        if (state.assets.length === 0) {
            return;
        }

        scheduleSnapshot(history, state);
        state = {
            ...state,
            assets: state.assets.filter((asset: typeof state.assets[number]) => asset.id !== assetId)
        };

        recalculate();
        scheduleSave();
        showUndoToast(history);
    }

    function clearAll(): void {
        scheduleSnapshot(history, state);
        state = createDefaultUiState();

        recalculate();
        scheduleSave();
        showUndoToast(history);
    }

    function clearAssetField(assetId: string, field: 'marketValueInput' | 'targetWeightInput' | 'investedCapitalInput'): void {
        updateAsset(assetId, {[field]: ''});
    }

    function undoChange(): void {
        const previous = restoreSnapshot(history);

        if (!previous) {
            hideUndoToast(history);
            return;
        }

        state = previous;
        recalculate();
        scheduleSave();

        if (history.snapshots.length === 0) {
            hideUndoToast(history);
        }
    }

    function actionLabel(action: 'BUY' | 'SELL' | 'HOLD'): string {
        if (action === 'BUY') {
            return m.page_rebalancer_action_buy();
        }

        if (action === 'SELL') {
            return m.page_rebalancer_action_sell();
        }

        return m.page_rebalancer_action_hold();
    }

    function actionClass(action: 'BUY' | 'SELL' | 'HOLD'): string {
        if (action === 'BUY') {
            return 'action-badge action-badge--buy';
        }

        if (action === 'SELL') {
            return 'action-badge action-badge--sell';
        }

        return 'action-badge action-badge--hold';
    }

    function actionNote(action: 'BUY' | 'SELL' | 'HOLD'): string {
        if (action === 'BUY') {
            return m.page_rebalancer_action_note_buy();
        }

        if (action === 'SELL') {
            return m.page_rebalancer_action_note_sell();
        }

        return m.page_rebalancer_action_note_hold();
    }

    function numericInputFieldKey(assetId: string, field: 'marketValue' | 'investedCapital'): string {
        return `${assetId}:${field}`;
    }

    function handleMoneyFieldFocus(assetId: string, field: 'marketValue' | 'investedCapital'): void {
        focusedNumericField = numericInputFieldKey(assetId, field);
    }

    function handleMoneyFieldBlur(): void {
        focusedNumericField = null;
    }

    function displayMoneyInput(assetId: string, field: 'marketValue' | 'investedCapital', rawValue: string): string {
        if (focusedNumericField === numericInputFieldKey(assetId, field)) {
            return rawValue;
        }

        return formatNumericInputForBlur(rawValue);
    }

    function allocationBarKindLabel(kind: 'CURRENT' | 'TARGET'): string {
        if (kind === 'CURRENT') {
            return m.page_rebalancer_allocation_current_short();
        }

        return m.page_rebalancer_allocation_target_short();
    }

    $: {
        currency.code;
        taxCountry.code;
        resultRounding.enabled;
        globalTaxProfile.capitalGainsTaxInput;
        globalTaxProfile.solidaritySurchargeInput;
        globalTaxProfile.churchTaxInput;
        globalTaxProfile.remainingSparerPauschbetragInput;
        recalculate();
    }
</script>

<section class="rebalancer-page">
    <header class="rebalancer-page__header">
        <h1 class="rebalancer-page__title">{m.page_rebalancer_title()}</h1>

        <nav class="rebalancer-page__actions">
            <button
                class="rebalancer-button rebalancer-button--danger"
                onclick={clearAll}
                aria-label={m.page_rebalancer_clear_all()}
            >
                {m.page_rebalancer_clear_all()}
            </button>
            <button
                class="rebalancer-button"
                onclick={undoChange}
                disabled={history.snapshots.length === 0}
                aria-label={m.page_rebalancer_undo()}
            >
                <Undo2 size={14} />
                {m.page_rebalancer_undo()}
            </button>
        </nav>
    </header>

    {#if history.undoToastVisible}
        <aside class="undo-toast">
            <button class="rebalancer-button" onclick={undoChange}>
                <Undo2 size={14} />
                {m.page_rebalancer_undo()}
            </button>
        </aside>
    {/if}

    <section class="rebalancer-grid">
        <AssetsPanel
            {state}
            {invalidFields}
            currencyCode={currency.code}
            taxCountryCode={taxCountry.code}
            onUpdateAsset={updateAsset}
            onAddAsset={addAsset}
            onRemoveAsset={removeAsset}
            onClearField={clearAssetField}
            onMoneyFocus={handleMoneyFieldFocus}
            onMoneyBlur={handleMoneyFieldBlur}
            {displayMoneyInput}
        />

        <DistributionPanel
            overviewExists={overview !== null}
            {allocationRows}
            resultRoundingEnabled={resultRounding.enabled}
            {formatPercent}
            {allocationBarKindLabel}
        />

        <OptionsPanel
            {overview}
            {optionACashActions}
            {optionBTradeActions}
            {selectedOption}
            currencyCode={currency.code}
            resultRoundingEnabled={resultRounding.enabled}
            onSelectOption={(option) => {
                selectedOption = option;
            }}
            {formatMoney}
            {actionLabel}
            {actionClass}
            {actionNote}
        />
    </section>
</section>
