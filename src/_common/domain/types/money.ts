import {DEFAULT_ROUNDING, type RoundingMode, roundDivide} from '../math/rounding';
import {Percentage} from './percentage';

export class Money {
    private readonly cents: number;

    private constructor(cents: number) {
        if (!Number.isFinite(cents) || !Number.isInteger(cents)) {
            throw new Error('Money cents must be an integer.');
        }
        this.cents = cents;
    }

    static fromCents(cents: number): Money {
        return new Money(cents);
    }

    static zero(): Money {
        return new Money(0);
    }

    toCents(): number {
        return this.cents;
    }

    add(other: Money): Money {
        return new Money(this.cents + other.cents);
    }

    subtract(other: Money): Money {
        return new Money(this.cents - other.cents);
    }

    multiplyByNumber(multiplier: number, mode: RoundingMode = DEFAULT_ROUNDING): Money {
        if (!Number.isFinite(multiplier)) {
            throw new Error('Multiplier must be finite.');
        }
        const product = this.cents * multiplier;
        const rounded = roundDivide(Math.round(product), 1, mode);
        return new Money(rounded);
    }

    multiplyByPercentage(percentage: Percentage, mode: RoundingMode = DEFAULT_ROUNDING): Money {
        const product = this.cents * percentage.toBasisPoints();
        const rounded = roundDivide(product, 10000, mode);
        return new Money(rounded);
    }

    multiplyDivide(multiplier: number, divisor: number, mode: RoundingMode = DEFAULT_ROUNDING): Money {
        if (!Number.isFinite(multiplier) || !Number.isFinite(divisor)) {
            throw new Error('Multiplier and divisor must be finite.');
        }
        if (!Number.isInteger(multiplier) || !Number.isInteger(divisor)) {
            throw new Error('Multiplier and divisor must be integers.');
        }
        const product = this.cents * multiplier;
        const rounded = roundDivide(product, divisor, mode);
        return new Money(rounded);
    }

    isZero(): boolean {
        return this.cents === 0;
    }

    isNegative(): boolean {
        return this.cents < 0;
    }

    abs(): Money {
        return new Money(Math.abs(this.cents));
    }

    compareTo(other: Money): number {
        if (this.cents === other.cents) {
            return 0;
        }
        return this.cents < other.cents ? -1 : 1;
    }

    max(other: Money): Money {
        return this.compareTo(other) >= 0 ? this : other;
    }

    min(other: Money): Money {
        return this.compareTo(other) <= 0 ? this : other;
    }
}
