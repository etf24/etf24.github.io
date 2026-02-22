import {describe, expect, it} from 'vitest';
import {Percentage} from './percentage';

describe('Percentage', () => {
    it('creates from percent and basis points', () => {
        expect(Percentage.fromPercent(12.5).toBasisPoints()).toBe(1250);
        expect(Percentage.fromBasisPoints(2500).toBasisPoints()).toBe(2500);
    });

    it('adds and subtracts', () => {
        const a = Percentage.fromPercent(40);
        const b = Percentage.fromPercent(10);
        expect(a.add(b).toBasisPoints()).toBe(5000);
        expect(a.subtract(b).toBasisPoints()).toBe(3000);
    });
});
