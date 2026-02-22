import {Percentage} from '$common/domain/types/percentage';
import {Money} from '$common/domain/types/money';

export interface TaxProfile {
    capitalGainsTax: Percentage;
    solidaritySurcharge: Percentage;
    churchTax: Percentage;
    roundingMode: 'CENT' | 'EURO';
    remainingSparerPauschbetrag: Money;
}

export function createTaxProfile(params: {
    capitalGainsTax: Percentage;
    solidaritySurcharge?: Percentage;
    churchTax?: Percentage;
    roundingMode?: 'CENT' | 'EURO';
    remainingSparerPauschbetrag?: Money;
}): TaxProfile {
    return {
        capitalGainsTax: params.capitalGainsTax,
        solidaritySurcharge: params.solidaritySurcharge ?? Percentage.fromBasisPoints(0),
        churchTax: params.churchTax ?? Percentage.fromBasisPoints(0),
        roundingMode: params.roundingMode ?? 'CENT',
        remainingSparerPauschbetrag: params.remainingSparerPauschbetrag ?? Money.zero()
    };
}

