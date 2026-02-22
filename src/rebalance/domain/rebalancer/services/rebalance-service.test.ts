import {describe, expect, it} from 'vitest';
import {Money} from '$common/domain/types/money';
import {Percentage} from '$common/domain/types/percentage';
import {PartialExemptionRate} from '../value-objects/partial-exemption-rate';
import {createTaxProfile} from '../value-objects/tax-profile';
import {calculateRebalancePlan} from './rebalance-service';

describe('calculateRebalancePlan', () => {
    it('calculates taxes on partial sell with partial exemption', () => {
        const plan = calculateRebalancePlan({
            assets: [
                {
                    id: 'A',
                    marketValueGross: Money.fromCents(1_000_000),
                    targetWeight: Percentage.fromPercent(50),
                    investedCapital: Money.fromCents(800_000),
                    partialExemption: PartialExemptionRate.fromPercent(30)
                },
                {
                    id: 'B',
                    marketValueGross: Money.fromCents(0),
                    targetWeight: Percentage.fromPercent(50)
                }
            ],
            taxProfile: createTaxProfile({
                capitalGainsTax: Percentage.fromPercent(25),
                solidaritySurcharge: Percentage.fromPercent(5.5),
                churchTax: Percentage.fromPercent(9)
            })
        });

        const assetA = plan.assets.find((asset) => asset.id === 'A');
        expect(assetA).toBeDefined();
        if (!assetA) {
            return;
        }

        expect(assetA.sellGross.toCents()).toBeGreaterThan(0);
        expect(assetA.taxOnSell.toCents()).toBeGreaterThan(0);
        expect(assetA.netProceeds.toCents()).toBeLessThan(assetA.sellGross.toCents());
        expect(plan.totalTaxesOnSell.toCents()).toBeGreaterThan(0);

        const residualCash = plan.cashShortfall.toCents() + plan.cashSurplus.toCents();
        expect(residualCash).toBeLessThanOrEqual(1);
    });

    it('does not tax losses', () => {
        const plan = calculateRebalancePlan({
            assets: [
                {
                    id: 'A',
                    marketValueGross: Money.fromCents(1_000_000),
                    targetWeight: Percentage.fromPercent(50),
                    investedCapital: Money.fromCents(1_200_000)
                },
                {
                    id: 'B',
                    marketValueGross: Money.fromCents(0),
                    targetWeight: Percentage.fromPercent(50)
                }
            ],
            taxProfile: createTaxProfile({
                capitalGainsTax: Percentage.fromPercent(25),
                solidaritySurcharge: Percentage.fromPercent(5.5)
            })
        });

        const assetA = plan.assets.find((asset) => asset.id === 'A');
        expect(assetA).toBeDefined();
        if (!assetA) {
            return;
        }

        expect(assetA.taxOnSell.toCents()).toBe(0);
        expect(plan.totalTaxesOnSell.toCents()).toBe(0);
    });

    it('applies remaining Sparer-Pauschbetrag portfolio-wide', () => {
        const withoutAllowance = calculateRebalancePlan({
            assets: [
                {
                    id: 'A',
                    marketValueGross: Money.fromCents(100_000),
                    targetWeight: Percentage.fromPercent(40),
                    investedCapital: Money.fromCents(60_000)
                },
                {
                    id: 'B',
                    marketValueGross: Money.fromCents(100_000),
                    targetWeight: Percentage.fromPercent(60),
                    investedCapital: Money.fromCents(90_000)
                }
            ],
            taxProfile: createTaxProfile({
                capitalGainsTax: Percentage.fromPercent(25),
                solidaritySurcharge: Percentage.fromPercent(5.5),
                churchTax: Percentage.fromPercent(0)
            })
        });

        const withAllowance = calculateRebalancePlan({
            assets: [
                {
                    id: 'A',
                    marketValueGross: Money.fromCents(100_000),
                    targetWeight: Percentage.fromPercent(40),
                    investedCapital: Money.fromCents(60_000)
                },
                {
                    id: 'B',
                    marketValueGross: Money.fromCents(100_000),
                    targetWeight: Percentage.fromPercent(60),
                    investedCapital: Money.fromCents(90_000)
                }
            ],
            taxProfile: createTaxProfile({
                capitalGainsTax: Percentage.fromPercent(25),
                solidaritySurcharge: Percentage.fromPercent(5.5),
                churchTax: Percentage.fromPercent(0),
                remainingSparerPauschbetrag: Money.fromCents(100_000)
            })
        });

        expect(withAllowance.totalTaxesOnSell.toCents()).toBeLessThan(withoutAllowance.totalTaxesOnSell.toCents());
    });

    it('rounds tax to full euros when configured', () => {
        const plan = calculateRebalancePlan({
            assets: [
                {
                    id: 'A',
                    marketValueGross: Money.fromCents(10_000_00),
                    targetWeight: Percentage.fromPercent(50),
                    investedCapital: Money.fromCents(8_000_00)
                },
                {
                    id: 'B',
                    marketValueGross: Money.fromCents(0),
                    targetWeight: Percentage.fromPercent(50)
                }
            ],
            taxProfile: createTaxProfile({
                capitalGainsTax: Percentage.fromPercent(25),
                solidaritySurcharge: Percentage.fromPercent(5.5),
                roundingMode: 'EURO'
            })
        });

        const assetA = plan.assets.find((asset) => asset.id === 'A');
        expect(assetA).toBeDefined();
        if (!assetA) {
            return;
        }

        expect(assetA.taxOnSell.toCents()).toBeGreaterThan(0);
        expect(assetA.taxOnSell.toCents() % 100).toBe(0);
    });

    it('normalizes target weights when they do not sum to 100%', () => {
        const plan = calculateRebalancePlan({
            assets: [
                {
                    id: 'A',
                    marketValueGross: Money.fromCents(5_000),
                    targetWeight: Percentage.fromPercent(60)
                },
                {
                    id: 'B',
                    marketValueGross: Money.fromCents(5_000),
                    targetWeight: Percentage.fromPercent(60)
                }
            ]
        });

        expect(plan.warnings).toContain('TARGET_WEIGHTS_NORMALIZED');
    });
});

