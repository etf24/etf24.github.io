import {DEFAULT_ROUNDING, roundDivide} from '$common/domain/math/rounding';
import {Money} from '$common/domain/types/money';
import {Percentage} from '$common/domain/types/percentage';
import {PartialExemptionRate} from '../value-objects/partial-exemption-rate';
import type {TaxProfile} from '../value-objects/tax-profile';

export interface FeeProfile {
    fixedFee?: Money;
    feeRate?: Percentage;
}

export interface AssetCalculationInput {
    id: string;
    marketValueGross: Money;
    targetWeight: Percentage;
    investedCapital?: Money;
    partialExemption?: PartialExemptionRate;
}

export interface AssetTradeResult {
    id: string;
    targetValue: Money;
    buyGross: Money;
    sellGross: Money;
    taxOnSell: Money;
    feeOnTrade: Money;
    netProceeds: Money;
}

export interface RebalancePlanResult {
    assets: AssetTradeResult[];
    totalBuys: Money;
    totalSellsGross: Money;
    totalSellNet: Money;
    totalTaxesOnSell: Money;
    cashShortfall: Money;
    cashSurplus: Money;
    warnings: string[];
}

export function calculateRebalancePlan(params: {
    assets: AssetCalculationInput[];
    taxProfile?: TaxProfile;
    fees?: FeeProfile;
}): RebalancePlanResult {
    const warnings: string[] = [];
    const assets = params.assets;

    if (assets.length === 0) {
        return {
            assets: [],
            totalBuys: Money.zero(),
            totalSellsGross: Money.zero(),
            totalSellNet: Money.zero(),
            totalTaxesOnSell: Money.zero(),
            cashShortfall: Money.zero(),
            cashSurplus: Money.zero(),
            warnings: ['NO_ASSETS']
        };
    }

    if (assets.length > 10) {
        warnings.push('ASSET_LIMIT_EXCEEDED');
    }

    const totalGross = assets.reduce((sum, asset) => sum.add(asset.marketValueGross), Money.zero());
    const targetWeights = normalizeTargetWeights(assets.map((asset) => asset.targetWeight), warnings);
    const maxTargetTotal = totalGross.toCents();
    let low = 0;
    let high = maxTargetTotal;
    let best = evaluatePlanAtTargetTotal(assets, targetWeights, params.taxProfile, params.fees, totalGross);

    for (let i = 0; i < 40; i += 1) {
        const mid = Math.floor((low + high) / 2);
        const candidate = evaluatePlanAtTargetTotal(
            assets,
            targetWeights,
            params.taxProfile,
            params.fees,
            Money.fromCents(mid)
        );

        const candidateAbs = Math.abs(candidate.cashBalance.toCents());
        const bestAbs = Math.abs(best.cashBalance.toCents());
        if (candidateAbs < bestAbs) {
            best = candidate;
        }

        if (candidate.cashBalance.toCents() >= 0) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }

    const cashShortfall = best.cashBalance.isNegative() ? best.cashBalance.abs() : Money.zero();
    const cashSurplus = best.cashBalance.isNegative() ? Money.zero() : best.cashBalance;

    if (!cashShortfall.isZero() || !cashSurplus.isZero()) {
        warnings.push('TRADE_PLAN_ROUNDING_RESIDUAL');
    }

    return {
        assets: best.results,
        totalBuys: best.totalBuys,
        totalSellsGross: best.totalSellsGross,
        totalSellNet: best.totalSellNet,
        totalTaxesOnSell: best.totalTaxesOnSell,
        cashShortfall,
        cashSurplus,
        warnings
    };
}

export function calculateCashOnlyPlan(params: {
    assets: AssetCalculationInput[];
}): {cashNeeded: Money; buys: Array<{id: string; buyAmount: Money}>; warnings: string[]} {
    const warnings: string[] = [];
    const assets = params.assets;

    if (assets.length === 0) {
        return {cashNeeded: Money.zero(), buys: [], warnings: ['NO_ASSETS']};
    }

    if (assets.length > 10) {
        warnings.push('ASSET_LIMIT_EXCEEDED');
    }

    const totalGross = assets.reduce((sum, asset) => sum.add(asset.marketValueGross), Money.zero());
    const targetWeights = normalizeTargetWeights(assets.map((asset) => asset.targetWeight), warnings);

    let cashNeeded = Money.zero();
    for (let i = 0; i < 100; i += 1) {
        const targetTotal = totalGross.add(cashNeeded);
        const requiredCash = assets.reduce((sum, asset, index) => {
            const targetValue = targetTotal.multiplyByPercentage(targetWeights[index]);
            const gap = targetValue.subtract(asset.marketValueGross);
            return sum.add(gap.isNegative() ? Money.zero() : gap);
        }, Money.zero());

        if (requiredCash.toCents() === cashNeeded.toCents()) {
            cashNeeded = requiredCash;
            break;
        }
        cashNeeded = requiredCash;

        if (i === 99) {
            warnings.push('CASH_ONLY_NOT_CONVERGED');
        }
    }

    const targetTotal = totalGross.add(cashNeeded);
    const buys = assets.map((asset, index) => {
        const targetValue = targetTotal.multiplyByPercentage(targetWeights[index]);
        const gap = targetValue.subtract(asset.marketValueGross);
        return {id: asset.id, buyAmount: gap.isNegative() ? Money.zero() : gap};
    });

    return {cashNeeded, buys, warnings};
}

export function calculateMonthsToTarget(params: {cashNeeded: Money; monthlySavings: Money}): number | null {
    if (params.monthlySavings.isZero()) {
        return null;
    }
    const ratio = params.cashNeeded.toCents() / params.monthlySavings.toCents();
    return Math.ceil(ratio);
}

function calculateFee(tradeGross: Money, fees?: FeeProfile): Money {
    if (!fees || tradeGross.isZero()) {
        return Money.zero();
    }

    const fixedFee = fees.fixedFee ?? Money.zero();
    const rateFee = fees.feeRate ? tradeGross.multiplyByPercentage(fees.feeRate) : Money.zero();
    return fixedFee.add(rateFee);
}

function calculateTaxAmount(taxBase: Money, taxProfile?: TaxProfile): Money {
    if (!taxProfile) {
        return Money.zero();
    }

    const capTax = taxBase.multiplyByPercentage(taxProfile.capitalGainsTax);
    const solidarity = capTax.multiplyByPercentage(taxProfile.solidaritySurcharge);
    const church = capTax.multiplyByPercentage(taxProfile.churchTax);

    let total = capTax.add(solidarity).add(church);
    if (taxProfile.roundingMode === 'EURO') {
        const euros = roundDivide(total.toCents(), 100, DEFAULT_ROUNDING);
        total = Money.fromCents(euros * 100);
    }
    return total;
}

function evaluatePlanAtTargetTotal(
    assets: AssetCalculationInput[],
    targetWeights: Percentage[],
    taxProfile: TaxProfile | undefined,
    fees: FeeProfile | undefined,
    targetTotal: Money
): {
    results: AssetTradeResult[];
    totalBuys: Money;
    totalSellsGross: Money;
    totalSellNet: Money;
    totalTaxesOnSell: Money;
    cashBalance: Money;
} {
    const interimResults: Array<{
        id: string;
        targetValue: Money;
        buyGross: Money;
        sellGross: Money;
        feeOnTrade: Money;
        taxBaseRaw: Money;
    }> = [];
    let totalBuys = Money.zero();
    let totalSellsGross = Money.zero();
    let totalTaxBaseRaw = Money.zero();

    assets.forEach((asset, index) => {
        const targetValue = targetTotal.multiplyByPercentage(targetWeights[index]);
        const delta = targetValue.subtract(asset.marketValueGross);

        const buyGross = delta.isNegative() ? Money.zero() : delta;
        const sellGross = delta.isNegative() ? delta.abs() : Money.zero();

        const feeOnTrade = calculateFee(delta.isNegative() ? sellGross : buyGross, fees);

        let taxBaseRaw = Money.zero();
        if (!sellGross.isZero()) {
            const investedCapital = asset.investedCapital ?? asset.marketValueGross;
            const unrealizedGain = asset.marketValueGross.subtract(investedCapital);

            const realizedGain = asset.marketValueGross.isZero()
                ? Money.zero()
                : sellGross.multiplyDivide(unrealizedGain.toCents(), asset.marketValueGross.toCents());

            const partialExemption = asset.partialExemption ?? PartialExemptionRate.none();
            const taxableGain = realizedGain.isNegative() ? Money.zero() : realizedGain;
            taxBaseRaw = taxableGain.multiplyByPercentage(
                Percentage.fromBasisPoints(10000 - partialExemption.toPercentage().toBasisPoints())
            );
        }

        totalBuys = totalBuys.add(buyGross).add(delta.isNegative() ? Money.zero() : feeOnTrade);
        totalSellsGross = totalSellsGross.add(sellGross);
        totalTaxBaseRaw = totalTaxBaseRaw.add(taxBaseRaw);

        interimResults.push({
            id: asset.id,
            targetValue,
            buyGross,
            sellGross,
            feeOnTrade,
            taxBaseRaw
        });
    });

    const remainingSparerPauschbetrag = taxProfile?.remainingSparerPauschbetrag ?? Money.zero();
    const taxableBaseAfterAllowanceCents = Math.max(
        0,
        totalTaxBaseRaw.toCents() - remainingSparerPauschbetrag.toCents()
    );

    const rawTaxBases = interimResults.map((result) => result.taxBaseRaw.toCents());
    const allocatedTaxBaseCents = allocateProRataCents(rawTaxBases, taxableBaseAfterAllowanceCents);

    const results: AssetTradeResult[] = [];
    let totalSellNet = Money.zero();
    let totalTaxesOnSell = Money.zero();

    interimResults.forEach((result, index) => {
        const allocatedTaxBase = Money.fromCents(allocatedTaxBaseCents[index]);
        const taxOnSell = calculateTaxAmount(allocatedTaxBase, taxProfile);
        const netProceeds = result.sellGross.subtract(taxOnSell).subtract(result.feeOnTrade);

        totalSellNet = totalSellNet.add(netProceeds);
        totalTaxesOnSell = totalTaxesOnSell.add(taxOnSell);

        results.push({
            id: result.id,
            targetValue: result.targetValue,
            buyGross: result.buyGross,
            sellGross: result.sellGross,
            taxOnSell,
            feeOnTrade: result.feeOnTrade,
            netProceeds
        });
    });

    return {
        results,
        totalBuys,
        totalSellsGross,
        totalSellNet,
        totalTaxesOnSell,
        cashBalance: totalSellNet.subtract(totalBuys)
    };
}

function allocateProRataCents(rawCents: number[], totalAllocated: number): number[] {
    if (totalAllocated <= 0) {
        return rawCents.map(() => 0);
    }

    const totalRaw = rawCents.reduce((sum, value) => sum + value, 0);
    if (totalRaw <= 0) {
        return rawCents.map(() => 0);
    }

    const floors = rawCents.map((value) => Math.floor((value * totalAllocated) / totalRaw));
    const allocatedByFloor = floors.reduce((sum, value) => sum + value, 0);
    let remainder = totalAllocated - allocatedByFloor;

    const ranking = rawCents
        .map((value, index) => ({
            index,
            fractional: (value * totalAllocated) / totalRaw - floors[index]
        }))
        .sort((left, right) => right.fractional - left.fractional || left.index - right.index);

    for (let i = 0; i < ranking.length && remainder > 0; i += 1) {
        floors[ranking[i].index] += 1;
        remainder -= 1;
    }

    return floors;
}

function normalizeTargetWeights(weights: Percentage[], warnings: string[]): Percentage[] {
    const sumBps = weights.reduce((sum, weight) => sum + weight.toBasisPoints(), 0);
    if (sumBps === 0) {
        warnings.push('TARGET_WEIGHTS_ZERO');
        return weights;
    }
    if (sumBps !== 10000) {
        warnings.push('TARGET_WEIGHTS_NORMALIZED');
    }

    let runningSum = 0;
    return weights.map((weight, index) => {
        if (index === weights.length - 1) {
            const remainder = 10000 - runningSum;
            return Percentage.fromBasisPoints(remainder);
        }
        const normalizedBps = Math.round((weight.toBasisPoints() * 10000) / sumBps);
        runningSum += normalizedBps;
        return Percentage.fromBasisPoints(normalizedBps);
    });
}

