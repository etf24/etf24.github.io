import {describe, expect, it} from 'vitest';
import {Money} from '$common/domain/types/money';
import {Percentage} from '$common/domain/types/percentage';
import {calculateRebalanceOverview} from './calculate-rebalance';
import {createTaxProfile} from '$rebalance/domain/rebalancer/value-objects/tax-profile';
import {PartialExemptionRate} from '$rebalance/domain/rebalancer/value-objects/partial-exemption-rate';

describe('calculateRebalanceOverview', () => {
    it('returns cash-only and trade options', () => {
        const overview = calculateRebalanceOverview({
            assets: [
                {
                    id: 'A',
                    marketValueGross: Money.fromCents(7_000_00),
                    targetWeight: Percentage.fromPercent(70)
                },
                {
                    id: 'B',
                    marketValueGross: Money.fromCents(3_000_00),
                    targetWeight: Percentage.fromPercent(30)
                }
            ]
        });

        expect(overview.optionB_tradeRebalance.actions.length).toBe(2);
        expect(overview.optionA_cashOnly.cashNeeded.toCents()).toBe(0);
    });

    it('in trade option it compensates taxes by selling more than buying', () => {
        const overview = calculateRebalanceOverview({
            assets: [
                {
                    id: 'alpha',
                    marketValueGross: Money.fromCents(700_00),
                    targetWeight: Percentage.fromPercent(72),
                    investedCapital: Money.fromCents(650_00),
                    partialExemption: PartialExemptionRate.fromPercent(15)
                },
                {
                    id: 'bravo',
                    marketValueGross: Money.fromCents(300_00),
                    targetWeight: Percentage.fromPercent(28),
                    investedCapital: Money.fromCents(200_00),
                    partialExemption: PartialExemptionRate.fromPercent(15)
                }
            ],
            taxCountry: 'DEU',
            taxProfile: createTaxProfile({
                capitalGainsTax: Percentage.fromPercent(25),
                solidaritySurcharge: Percentage.fromPercent(5.5),
                churchTax: Percentage.fromPercent(0),
                roundingMode: 'CENT'
            })
        });

        const tradeActions = overview.optionB_tradeRebalance.actions;
        const alphaAction = tradeActions.find((action) => action.id === 'alpha');
        const bravoAction = tradeActions.find((action) => action.id === 'bravo');

        expect(alphaAction?.action).toBe('BUY');
        expect(bravoAction?.action).toBe('SELL');
        expect((bravoAction?.amount.toCents() ?? 0)).toBeGreaterThan(alphaAction?.amount.toCents() ?? 0);

        const residualCash =
            overview.optionB_tradeRebalance.cashShortfall.toCents() +
            overview.optionB_tradeRebalance.cashSurplus.toCents();
        expect(residualCash).toBeLessThanOrEqual(1);
        expect(overview.optionB_tradeRebalance.totalTaxesOnSell.toCents()).toBeGreaterThan(0);
    });
});

