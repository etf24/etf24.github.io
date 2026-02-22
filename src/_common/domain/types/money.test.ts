import {describe, expect, it} from 'vitest';
import {Money} from './money';
import {Percentage} from './percentage';

describe('Money', () => {
    it('adds and subtracts cents', () => {
        const a = Money.fromCents(150);
        const b = Money.fromCents(40);

        expect(a.add(b).toCents()).toBe(190);
        expect(a.subtract(b).toCents()).toBe(110);
    });

    it('multiplies by percentage with half-up rounding', () => {
        const amount = Money.fromCents(100);
        const tenPercent = Percentage.fromPercent(10);
        expect(amount.multiplyByPercentage(tenPercent).toCents()).toBe(10);

        const third = Percentage.fromBasisPoints(3333);
        expect(Money.fromCents(1).multiplyByPercentage(third).toCents()).toBe(0);
        expect(Money.fromCents(2).multiplyByPercentage(third).toCents()).toBe(1);
    });

    it('multiplies and divides with rounding', () => {
        const amount = Money.fromCents(1000);
        expect(amount.multiplyDivide(1, 3).toCents()).toBe(333);
        expect(amount.multiplyDivide(2, 3).toCents()).toBe(667);
    });
});
