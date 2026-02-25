<script lang="ts">
    import {browser} from '$app/environment';
    import {Redo2, Undo2} from 'lucide-svelte';
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
        captureRedoSnapshot,
        captureSnapshot,
        captureSnapshotIfChanged,
        createDefaultUiState,
        createHistoryState,
        createNextAsset,
        type UiState,
        loadUiState,
        normalizeNumericInput,
        restoreRedoSnapshot,
        restoreSnapshot,
        saveUiState,
        toAllocationRows,
        toOptionActionRows,
        toOverview
    } from '$rebalance/presentation/rebalancer-ui-state';

    type EditableField = 'name' | 'marketValueInput' | 'targetWeightInput' | 'investedCapitalInput';

    let uiState: UiState = $state(browser ? loadUiState() : createDefaultUiState());
    let history = $state(createHistoryState());
    let selectedOption: 'A' | 'B' = $state('A');
    let saveTimer: number | null = $state(null);
    let focusedNumericField: string | null = $state(null);
    let fieldEditStartSnapshots = $state<Record<string, UiState>>({});

    const overviewMapping = $derived(
        toOverview(uiState, {
            taxCountry: taxCountry.code,
            capitalGainsTaxInput: globalTaxProfile.capitalGainsTaxInput,
            solidaritySurchargeInput: globalTaxProfile.solidaritySurchargeInput,
            churchTaxInput: globalTaxProfile.churchTaxInput,
            remainingSparerPauschbetragInput: globalTaxProfile.remainingSparerPauschbetragInput
        })
    );

    const overview = $derived(overviewMapping.overview);
    const invalidFields = $derived(overviewMapping.invalidFields);
    const allocationRows = $derived(toAllocationRows(uiState));
    const optionACashActions = $derived(
        overview ? toOptionActionRows(overview.optionA_cashOnly.actions, uiState.assets) : []
    );
    const optionBTradeActions = $derived(
        overview ? toOptionActionRows(overview.optionB_tradeRebalance.actions, uiState.assets) : []
    );

    function refreshHistory(): void {
        history = {
            ...history,
            snapshots: [...history.snapshots],
            redoSnapshots: [...history.redoSnapshots]
        };
    }

    function scheduleSave(): void {
        if (!browser) {
            return;
        }

        if (saveTimer !== null) {
            clearTimeout(saveTimer);
        }

        saveTimer = window.setTimeout(() => {
            saveUiState(uiState);
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
        const sanitized: Partial<UiState['assets'][number]> = {};

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

    function cloneUiState(state: UiState): UiState {
        return {
            assets: state.assets.map((asset) => ({...asset})),
            nextAssetIndex: state.nextAssetIndex
        };
    }

    function fieldKey(assetId: string, field: EditableField): string {
        return `${assetId}:${field}`;
    }

    function applyCommittedMutation(mutator: () => void): void {
        const previous = cloneUiState(uiState);
        const snapshotCountBefore = history.snapshots.length;

        mutator();
        captureSnapshotIfChanged(history, previous, uiState);

        if (history.snapshots.length === snapshotCountBefore) {
            return;
        }

        history.redoSnapshots = [];
        refreshHistory();
        scheduleSave();
    }

    function updateAssetDraft(assetId: string, patch: Partial<UiState['assets'][number]>): void {
        const sanitized = sanitizeAssetPatch(patch);

        uiState = {
            ...uiState,
            assets: uiState.assets.map((asset: UiState['assets'][number]) =>
                asset.id === assetId ? {...asset, ...sanitized} : asset
            )
        };
    }

    function commitAssetPatch(assetId: string, patch: Partial<UiState['assets'][number]>): void {
        applyCommittedMutation(() => {
            const sanitized = sanitizeAssetPatch(patch);

            uiState = {
                ...uiState,
                assets: uiState.assets.map((asset: UiState['assets'][number]) =>
                    asset.id === assetId ? {...asset, ...sanitized} : asset
                )
            };
        });
    }

    function handleFieldFocus(assetId: string, field: EditableField): void {
        fieldEditStartSnapshots = {
            ...fieldEditStartSnapshots,
            [fieldKey(assetId, field)]: cloneUiState(uiState)
        };
    }

    function handleFieldBlur(assetId: string, field: EditableField): void {
        const key = fieldKey(assetId, field);
        const previous = fieldEditStartSnapshots[key];
        if (!previous) {
            return;
        }

        const nextSnapshots = {...fieldEditStartSnapshots};
        delete nextSnapshots[key];
        fieldEditStartSnapshots = nextSnapshots;

        const snapshotCountBefore = history.snapshots.length;
        captureSnapshotIfChanged(history, previous, uiState);

        if (history.snapshots.length === snapshotCountBefore) {
            return;
        }

        history.redoSnapshots = [];
        refreshHistory();
        scheduleSave();
    }

    function addAsset(): void {
        if (uiState.assets.length >= 10) {
            return;
        }

        applyCommittedMutation(() => {
            const draft = {
                ...uiState,
                assets: [...uiState.assets]
            };

            draft.assets.push(createNextAsset(draft));
            uiState = draft;
        });
    }

    function removeAsset(assetId: string): void {
        if (uiState.assets.length === 0) {
            return;
        }

        applyCommittedMutation(() => {
            uiState = {
                ...uiState,
                assets: uiState.assets.filter((asset: UiState['assets'][number]) => asset.id !== assetId)
            };
        });
    }

    function clearAll(): void {
        applyCommittedMutation(() => {
            uiState = createDefaultUiState();
        });
    }

    function clearAssetField(assetId: string, field: 'marketValueInput' | 'targetWeightInput' | 'investedCapitalInput'): void {
        commitAssetPatch(assetId, {[field]: ''});
    }

    function undoChange(): void {
        const previous = restoreSnapshot(history);

        if (!previous) {
            refreshHistory();
            return;
        }

        captureRedoSnapshot(history, uiState);
        uiState = previous;
        fieldEditStartSnapshots = {};
        scheduleSave();

        refreshHistory();
    }

    function redoChange(): void {
        const next = restoreRedoSnapshot(history);

        if (!next) {
            refreshHistory();
            return;
        }

        captureSnapshot(history, uiState);
        uiState = next;
        fieldEditStartSnapshots = {};
        scheduleSave();

        refreshHistory();
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
            <button
                class="rebalancer-button"
                onclick={redoChange}
                disabled={history.redoSnapshots.length === 0}
                aria-label={m.page_rebalancer_redo()}
            >
                <Redo2 size={14} />
                {m.page_rebalancer_redo()}
            </button>
        </nav>
    </header>

    <section class="rebalancer-grid">
        <AssetsPanel
            state={uiState}
            {invalidFields}
            currencyCode={currency.code}
            taxCountryCode={taxCountry.code}
            onUpdateAssetDraft={updateAssetDraft}
            onCommitAssetPatch={commitAssetPatch}
            onAddAsset={addAsset}
            onRemoveAsset={removeAsset}
            onClearField={clearAssetField}
            onFieldFocus={handleFieldFocus}
            onFieldBlur={handleFieldBlur}
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
            taxCountryCode={taxCountry.code}
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
