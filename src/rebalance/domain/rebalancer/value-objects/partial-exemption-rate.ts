import {Percentage} from '$common/domain/types/percentage';

export class PartialExemptionRate {
    private readonly rate: Percentage;

    private constructor(rate: Percentage) {
        this.rate = rate;
    }

    static fromPercent(percent: 0 | 15 | 30): PartialExemptionRate {
        return new PartialExemptionRate(Percentage.fromPercent(percent));
    }

    toPercentage(): Percentage {
        return this.rate;
    }

    static none(): PartialExemptionRate {
        return PartialExemptionRate.fromPercent(0);
    }
}

