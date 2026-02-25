import {describe, expect, it} from 'vitest';
import {
    captureRedoSnapshot,
    captureSnapshot,
    captureSnapshotIfChanged,
    createDefaultUiState,
    createHistoryState,
    normalizeNumericInput,
    restoreRedoSnapshot,
    restoreSnapshot,
    toOverview
} from '$rebalance/presentation/rebalancer-ui-state';
import {formatCents, formatPercent} from '$lib/formatting/result-format';
import {formatNumericInputForBlur, stripGroupingSeparators} from '$lib/formatting/input-format';

describe('rebalancer ui defaults', () => {
    it('uses 700/72 and 300/28 for the initial setup', () => {
        const state = createDefaultUiState();

        expect(state.assets).toHaveLength(2);
        expect(state.assets[0].name).toBe('Alpha');
        expect(state.assets[0].marketValueInput).toBe('700');
        expect(state.assets[0].targetWeightInput).toBe('72');

        expect(state.assets[1].name).toBe('Bravo');
        expect(state.assets[1].marketValueInput).toBe('300');
        expect(state.assets[1].targetWeightInput).toBe('28');
    });
});

describe('formatting', () => {
    it('formats money by configured currency placement', () => {
        expect(formatCents(12345, 'NONE', false)).toBe('123.45');
        expect(formatCents(12345, 'EUR', false)).toBe('123.45€');
        expect(formatCents(12345, 'USD', false)).toBe('$123.45');
        expect(formatCents(10025519, 'EUR', false)).toBe('100,255.19€');
    });

    it('formats percentages without unnecessary trailing zeros', () => {
        expect(formatPercent(70, false)).toBe('70%');
        expect(formatPercent(70.5, false)).toBe('70.5%');
        expect(formatPercent(70.555, false)).toBe('70.56%');
    });

    it('normalizes comma decimal input to dot decimal', () => {
        expect(normalizeNumericInput('12,34')).toBe('12.34');
    });

    it('formats numeric input values for blur and strips grouping separators', () => {
        expect(formatNumericInputForBlur('1000')).toBe('1,000');
        expect(formatNumericInputForBlur('1000.5')).toBe('1,000.5');
        expect(stripGroupingSeparators('1,000.5')).toBe('1000.5');
    });
});

describe('target weight validation', () => {
    it('marks all target-weight fields invalid when total target weight is above 100%', () => {
        const state = createDefaultUiState();

        state.assets = [
            {
                ...state.assets[0],
                id: 'asset-1',
                name: 'Alpha',
                marketValueInput: '700',
                targetWeightInput: '60'
            },
            {
                ...state.assets[1],
                id: 'asset-2',
                name: 'Bravo',
                marketValueInput: '300',
                targetWeightInput: '50'
            }
        ];

        const mapped = toOverview(state);

        expect(mapped.invalidFields['asset-1']?.targetWeight).toBe(true);
        expect(mapped.invalidFields['asset-2']?.targetWeight).toBe(true);
    });
});

describe('tax allowance input', () => {
    it('treats empty remaining Sparer-Pauschbetrag input as zero', () => {
        const state = createDefaultUiState();

        state.assets = [
            {
                ...state.assets[0],
                id: 'asset-1',
                marketValueInput: '700',
                targetWeightInput: '72',
                investedCapitalInput: '650'
            },
            {
                ...state.assets[1],
                id: 'asset-2',
                marketValueInput: '300',
                targetWeightInput: '28',
                investedCapitalInput: '200'
            }
        ];

        const withEmptyAllowance = toOverview(state, {
            taxCountry: 'DEU',
            capitalGainsTaxInput: '25',
            solidaritySurchargeInput: '5.5',
            churchTaxInput: '0',
            remainingSparerPauschbetragInput: ''
        });

        const withZeroAllowance = toOverview(state, {
            taxCountry: 'DEU',
            capitalGainsTaxInput: '25',
            solidaritySurchargeInput: '5.5',
            churchTaxInput: '0',
            remainingSparerPauschbetragInput: '0'
        });

        expect(withEmptyAllowance.overview?.optionB_tradeRebalance.totalTaxesOnSell.toCents()).toBe(
            withZeroAllowance.overview?.optionB_tradeRebalance.totalTaxesOnSell.toCents()
        );
    });
});

describe('history redo', () => {
    it('restores state across undo and redo and clears redo on new change flow', () => {
        const history = createHistoryState();
        const initial = createDefaultUiState();

        captureSnapshot(history, initial);

        const edited = {
            ...initial,
            assets: initial.assets.map((asset, index) => (index === 0 ? {...asset, marketValueInput: '999'} : asset))
        };

        const undone = restoreSnapshot(history);
        expect(undone?.assets[0].marketValueInput).toBe('700');

        captureRedoSnapshot(history, edited);
        const redone = restoreRedoSnapshot(history);
        expect(redone?.assets[0].marketValueInput).toBe('999');

        history.redoSnapshots = [redone!];
        history.redoSnapshots = [];
        expect(history.redoSnapshots).toHaveLength(0);
    });
});

describe('history snapshots', () => {
    it('captures snapshot only when ui state changed', () => {
        const history = createHistoryState();
        const previous = createDefaultUiState();
        const nextUnchanged = createDefaultUiState();

        captureSnapshotIfChanged(history, previous, nextUnchanged);
        expect(history.snapshots).toHaveLength(0);

        const nextChanged = {
            ...nextUnchanged,
            assets: nextUnchanged.assets.map((asset, index) =>
                index === 0 ? {...asset, targetWeightInput: '71'} : asset
            )
        };

        captureSnapshotIfChanged(history, previous, nextChanged);
        expect(history.snapshots).toHaveLength(1);
    });
});
