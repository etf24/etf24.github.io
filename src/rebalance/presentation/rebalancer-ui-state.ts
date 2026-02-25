import {Money} from '$common/domain/types/money';
import {Percentage} from '$common/domain/types/percentage';
import {calculateRebalanceOverview} from '$rebalance/application/rebalancer/use-cases/calculate-rebalance';
import type {AssetInputDto, RebalanceOverviewDto, RebalanceActionDto} from '$rebalance/application/rebalancer/dto/rebalance-dto';
import {PartialExemptionRate} from '$rebalance/domain/rebalancer/value-objects/partial-exemption-rate';
import {createTaxProfile} from '$rebalance/domain/rebalancer/value-objects/tax-profile';

const STORAGE_KEY = 'rebalancer.v1.state';
const STORAGE_VERSION = 1;
const HISTORY_LIMIT = 20;
const COLOR_TOKENS = ['asset-a', 'asset-b', 'asset-c', 'asset-d', 'asset-e', 'asset-f'];
const NATO_NAMES = [
    'Alpha',
    'Bravo',
    'Charlie',
    'Delta',
    'Echo',
    'Foxtrot',
    'Golf',
    'Hotel',
    'India',
    'Juliet',
    'Kilo',
    'Lima',
    'Mike',
    'November',
    'Oscar',
    'Papa',
    'Quebec',
    'Romeo',
    'Sierra',
    'Tango',
    'Uniform',
    'Victor',
    'Whiskey',
    'Xray',
    'Yankee',
    'Zulu'
];

export interface UiAsset {
    id: string;
    label: string;
    colorToken: string;
    name: string;
    marketValueInput: string;
    targetWeightInput: string;
    investedCapitalInput: string;
    partialExemption: 0 | 15 | 30;
}

export interface UiState {
    assets: UiAsset[];
    nextAssetIndex: number;
}

export interface HistoryState {
    snapshots: UiState[];
    redoSnapshots: UiState[];
    undoToastVisible: boolean;
    undoToastTimer: number | null;
}

interface PersistedState {
    schemaVersion: number;
    state: UiState;
}

export type InvalidFieldName = 'marketValue' | 'targetWeight' | 'investedCapital';

export interface InvalidFieldMap {
    [assetId: string]: Partial<Record<InvalidFieldName, boolean>>;
}

export interface AllocationRow {
    id: string;
    name: string;
    colorToken: string;
    currentWeightPercent: number;
    targetWeightPercent: number;
}

export interface UiActionRow {
    id: string;
    name: string;
    colorToken: string;
    action: RebalanceActionDto['action'];
    amount: Money;
}

export function createDefaultUiState(): UiState {
    return {
        assets: [createAsset(1, '700', '72'), createAsset(2, '300', '28')],
        nextAssetIndex: 3
    };
}

export function createHistoryState(): HistoryState {
    return {
        snapshots: [],
        redoSnapshots: [],
        undoToastVisible: false,
        undoToastTimer: null
    };
}

export function loadUiState(): UiState {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return createDefaultUiState();
        }

        const parsed = JSON.parse(raw) as PersistedState;
        if (parsed.schemaVersion !== STORAGE_VERSION) {
            return createDefaultUiState();
        }

        return sanitizeUiState(parsed.state);
    } catch {
        return createDefaultUiState();
    }
}

export function saveUiState(state: UiState): void {
    const payload: PersistedState = {
        schemaVersion: STORAGE_VERSION,
        state
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function captureSnapshot(history: HistoryState, state: UiState): void {
    history.snapshots = [...history.snapshots, cloneState(state)].slice(-HISTORY_LIMIT);
}

export function captureSnapshotIfChanged(history: HistoryState, previous: UiState, next: UiState): void {
    if (areUiStatesEqual(previous, next)) {
        return;
    }

    captureSnapshot(history, previous);
}

export function restoreSnapshot(history: HistoryState): UiState | null {
    const previous = history.snapshots[history.snapshots.length - 1];
    if (!previous) {
        return null;
    }

    history.snapshots = history.snapshots.slice(0, -1);
    return cloneState(previous);
}

export function captureRedoSnapshot(history: HistoryState, state: UiState): void {
    history.redoSnapshots = [...history.redoSnapshots, cloneState(state)].slice(-HISTORY_LIMIT);
}

export function restoreRedoSnapshot(history: HistoryState): UiState | null {
    const next = history.redoSnapshots[history.redoSnapshots.length - 1];
    if (!next) {
        return null;
    }

    history.redoSnapshots = history.redoSnapshots.slice(0, -1);
    return cloneState(next);
}

export function showUndoToast(history: HistoryState): void {
    history.undoToastVisible = true;
    if (history.undoToastTimer !== null) {
        clearTimeout(history.undoToastTimer);
    }

    history.undoToastTimer = window.setTimeout(() => {
        history.undoToastVisible = false;
        history.undoToastTimer = null;
    }, 10000);
}

export function hideUndoToast(history: HistoryState): void {
    history.undoToastVisible = false;
    if (history.undoToastTimer !== null) {
        clearTimeout(history.undoToastTimer);
        history.undoToastTimer = null;
    }
}

export function createNextAsset(state: UiState): UiAsset {
    const asset = createAsset(state.nextAssetIndex, '', '0');
    state.nextAssetIndex += 1;
    return asset;
}

export function normalizeNumericInput(input: string): string {
    return input.replace(',', '.');
}

export function toOverview(state: UiState): {
    overview: RebalanceOverviewDto | null;
    invalidFields: InvalidFieldMap;
};
export function toOverview(
    state: UiState,
    options: {
        taxCountry: 'NONE' | 'DEU';
        capitalGainsTaxInput: string;
        solidaritySurchargeInput: string;
        churchTaxInput: string;
        remainingSparerPauschbetragInput: string;
    }
): {
    overview: RebalanceOverviewDto | null;
    invalidFields: InvalidFieldMap;
};
export function toOverview(
    state: UiState,
    options: {
        taxCountry: 'NONE' | 'DEU';
        capitalGainsTaxInput: string;
        solidaritySurchargeInput: string;
        churchTaxInput: string;
        remainingSparerPauschbetragInput: string;
    } = {
        taxCountry: 'NONE',
        capitalGainsTaxInput: '',
        solidaritySurchargeInput: '',
        churchTaxInput: '',
        remainingSparerPauschbetragInput: ''
    }
): {
    overview: RebalanceOverviewDto | null;
    invalidFields: InvalidFieldMap;
} {
    const dtoAssets: AssetInputDto[] = [];
    const invalidFields: InvalidFieldMap = {};
    let combinedTargetWeight = 0;

    for (const asset of state.assets) {
        const marketValue = parseRequiredMoneyToCents(asset.marketValueInput);
        const targetWeight = parseRequiredPercent(asset.targetWeightInput);
        const investedCapital = parseOptionalMoneyToCents(asset.investedCapitalInput);

        const fieldErrors: Partial<Record<InvalidFieldName, boolean>> = {};
        if (!marketValue.isValid) {
            fieldErrors.marketValue = true;
        }

        if (!targetWeight.isValid) {
            fieldErrors.targetWeight = true;
        } else if (targetWeight.value !== null) {
            combinedTargetWeight += targetWeight.value;
        }

        if (investedCapital.isInvalid) {
            fieldErrors.investedCapital = true;
        }

        if (Object.keys(fieldErrors).length > 0) {
            invalidFields[asset.id] = fieldErrors;
        }

        if (!marketValue.isValid || !targetWeight.isValid || marketValue.value === null || targetWeight.value === null) {
            continue;
        }

        const dtoAsset: AssetInputDto = {
            id: asset.id,
            marketValueGross: Money.fromCents(marketValue.value),
            targetWeight: Percentage.fromPercent(targetWeight.value)
        };

        if (investedCapital.value !== null) {
            dtoAsset.investedCapital = Money.fromCents(investedCapital.value);
        }

        if (options.taxCountry === 'DEU' && (asset.partialExemption === 15 || asset.partialExemption === 30)) {
            dtoAsset.partialExemption = PartialExemptionRate.fromPercent(asset.partialExemption);
        }

        dtoAssets.push(dtoAsset);
    }

    if (combinedTargetWeight > 100) {
        for (const asset of state.assets) {
            invalidFields[asset.id] = {
                ...invalidFields[asset.id],
                targetWeight: true
            };
        }
    }

    if (dtoAssets.length === 0) {
        return {overview: null, invalidFields};
    }

    const input: {
        assets: AssetInputDto[];
        taxCountry: 'NONE' | 'DEU';
        taxProfile?: ReturnType<typeof createTaxProfile>;
    } = {
        assets: dtoAssets,
        taxCountry: options.taxCountry
    };

    if (options.taxCountry === 'DEU') {
        const cap = parsePercent(options.capitalGainsTaxInput);
        const soli = parsePercent(options.solidaritySurchargeInput);
        const church = parsePercent(options.churchTaxInput);
        const remainingSparerPauschbetrag = parseMoneyToCentsOrZero(options.remainingSparerPauschbetragInput);

        if (cap !== null && soli !== null && church !== null && remainingSparerPauschbetrag !== null) {
            input.taxProfile = createTaxProfile({
                capitalGainsTax: Percentage.fromPercent(cap),
                solidaritySurcharge: Percentage.fromPercent(soli),
                churchTax: Percentage.fromPercent(church),
                roundingMode: 'CENT',
                remainingSparerPauschbetrag: Money.fromCents(remainingSparerPauschbetrag)
            });
        }
    }

    return {
        overview: calculateRebalanceOverview(input),
        invalidFields
    };
}

export function toAllocationRows(state: UiState): AllocationRow[] {
    const parsed = state.assets
        .map((asset) => {
            const marketValue = parseRequiredMoneyToCents(asset.marketValueInput);
            const targetWeight = parseRequiredPercent(asset.targetWeightInput);

            if (!marketValue.isValid || !targetWeight.isValid || marketValue.value === null || targetWeight.value === null) {
                return null;
            }

            return {
                id: asset.id,
                name: asset.name.trim() || asset.label,
                colorToken: asset.colorToken,
                marketValueCents: marketValue.value,
                targetWeightPercent: targetWeight.value
            };
        })
        .filter((asset): asset is NonNullable<typeof asset> => asset !== null);

    const totalMarketValue = parsed.reduce((total, asset) => total + asset.marketValueCents, 0);
    if (totalMarketValue <= 0) {
        return [];
    }

    return parsed.map((asset) => ({
        id: asset.id,
        name: asset.name,
        colorToken: asset.colorToken,
        currentWeightPercent: (asset.marketValueCents / totalMarketValue) * 100,
        targetWeightPercent: asset.targetWeightPercent
    }));
}

export function toOptionActionRows(actions: RebalanceActionDto[], assets: UiAsset[]): UiActionRow[] {
    const displayById = new Map(
        assets.map((asset) => [asset.id, {name: asset.name.trim() || asset.label, colorToken: asset.colorToken}])
    );

    return actions.map((action) => ({
        id: action.id,
        name: displayById.get(action.id)?.name ?? action.id,
        colorToken: displayById.get(action.id)?.colorToken ?? 'asset-a',
        action: action.action,
        amount: action.amount
    }));
}

function createAsset(index: number, marketValueInput: string, targetWeightInput: string): UiAsset {
    const generatedName = getNatoName(index);

    return {
        id: `asset-${index}`,
        label: generatedName,
        colorToken: COLOR_TOKENS[(index - 1) % COLOR_TOKENS.length],
        name: generatedName,
        marketValueInput,
        targetWeightInput,
        investedCapitalInput: '',
        partialExemption: 0
    };
}

function parseMoneyToCents(input: string): number | null {
    const normalized = normalizeNumericInput(input.trim());
    if (!normalized) {
        return null;
    }

    const value = Number(normalized);
    if (!Number.isFinite(value) || value < 0) {
        return null;
    }

    return Math.round(value * 100);
}

function parseMoneyToCentsOrZero(input: string): number | null {
    const normalized = normalizeNumericInput(input.trim());
    if (!normalized) {
        return 0;
    }

    return parseMoneyToCents(normalized);
}

function parsePercent(input: string): number | null {
    const normalized = normalizeNumericInput(input.trim());
    if (!normalized) {
        return null;
    }

    const value = Number(normalized);
    if (!Number.isFinite(value) || value < 0 || value > 100) {
        return null;
    }

    return value;
}

function parseRequiredMoneyToCents(input: string): {value: number | null; isValid: boolean} {
    const value = parseMoneyToCents(input);
    return {value, isValid: value !== null};
}

function parseOptionalMoneyToCents(input: string): {value: number | null; isInvalid: boolean} {
    const raw = input.trim();
    if (!raw) {
        return {value: null, isInvalid: false};
    }

    const value = parseMoneyToCents(raw);
    return {value, isInvalid: value === null};
}

function parseRequiredPercent(input: string): {value: number | null; isValid: boolean} {
    const value = parsePercent(input);
    return {value, isValid: value !== null};
}

function getNatoName(index: number): string {
    if (index <= NATO_NAMES.length) {
        return NATO_NAMES[index - 1];
    }

    const baseName = NATO_NAMES[(index - 1) % NATO_NAMES.length];
    const iteration = Math.floor((index - 1) / NATO_NAMES.length) + 1;
    return `${baseName}${iteration}`;
}

function sanitizeUiState(state: UiState): UiState {
    const fallback = createDefaultUiState();

    if (!state || !Array.isArray(state.assets)) {
        return fallback;
    }

    const assets = state.assets
        .filter((asset) => typeof asset?.id === 'string' && typeof asset?.label === 'string')
        .map((asset, index) => ({
            id: asset.id,
            label: asset.label,
            colorToken: COLOR_TOKENS[index % COLOR_TOKENS.length],
            name: asset.name?.trim() ? asset.name : asset.label,
            marketValueInput: asset.marketValueInput ?? '',
            targetWeightInput: asset.targetWeightInput ?? '0',
            investedCapitalInput: asset.investedCapitalInput ?? '',
            partialExemption:
                asset.partialExemption === 15 || asset.partialExemption === 30
                    ? asset.partialExemption
                    : (0 as 0 | 15 | 30)
        }));

    return {
        assets: assets.length > 0 ? assets : fallback.assets,
        nextAssetIndex: Math.max(state.nextAssetIndex ?? assets.length + 1, assets.length + 1)
    };
}

function cloneState(state: UiState): UiState {
    return {
        assets: state.assets.map((asset) => ({...asset})),
        nextAssetIndex: state.nextAssetIndex
    };
}

function areUiStatesEqual(left: UiState, right: UiState): boolean {
    if (left.nextAssetIndex !== right.nextAssetIndex) {
        return false;
    }

    if (left.assets.length !== right.assets.length) {
        return false;
    }

    for (let i = 0; i < left.assets.length; i += 1) {
        const leftAsset = left.assets[i];
        const rightAsset = right.assets[i];

        if (
            leftAsset.id !== rightAsset.id ||
            leftAsset.label !== rightAsset.label ||
            leftAsset.colorToken !== rightAsset.colorToken ||
            leftAsset.name !== rightAsset.name ||
            leftAsset.marketValueInput !== rightAsset.marketValueInput ||
            leftAsset.targetWeightInput !== rightAsset.targetWeightInput ||
            leftAsset.investedCapitalInput !== rightAsset.investedCapitalInput ||
            leftAsset.partialExemption !== rightAsset.partialExemption
        ) {
            return false;
        }
    }

    return true;
}
