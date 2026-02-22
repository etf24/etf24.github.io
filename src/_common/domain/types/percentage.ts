export class Percentage {
    private readonly basisPoints: number;

    private constructor(basisPoints: number) {
        if (!Number.isFinite(basisPoints) || !Number.isInteger(basisPoints)) {
            throw new Error('Percentage basis points must be an integer.');
        }
        if (basisPoints < 0 || basisPoints > 10000) {
            throw new Error('Percentage basis points must be between 0 and 10000.');
        }
        this.basisPoints = basisPoints;
    }

    static fromBasisPoints(basisPoints: number): Percentage {
        return new Percentage(basisPoints);
    }

    static fromPercent(percent: number): Percentage {
        if (!Number.isFinite(percent)) {
            throw new Error('Percent must be finite.');
        }
        const basisPoints = Math.round(percent * 100);
        return new Percentage(basisPoints);
    }

    toBasisPoints(): number {
        return this.basisPoints;
    }

    add(other: Percentage): Percentage {
        return Percentage.fromBasisPoints(this.basisPoints + other.basisPoints);
    }

    subtract(other: Percentage): Percentage {
        return Percentage.fromBasisPoints(this.basisPoints - other.basisPoints);
    }

    isZero(): boolean {
        return this.basisPoints === 0;
    }
}
