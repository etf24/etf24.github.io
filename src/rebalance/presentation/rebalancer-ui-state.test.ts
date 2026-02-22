import {describe, expect, it} from 'vitest';
import {createDefaultUiState, normalizeNumericInput} from '$rebalance/presentation/rebalancer-ui-state';
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
