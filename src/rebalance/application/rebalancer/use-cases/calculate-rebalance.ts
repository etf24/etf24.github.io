import type {RebalanceActionDto, RebalanceInputDto, RebalanceOverviewDto, RebalancePlanDto} from '../dto/rebalance-dto';
import {calculateCashOnlyPlan, calculateRebalancePlan} from '$rebalance/domain/rebalancer/services/rebalance-service';

export function calculateRebalanceOverview(input: RebalanceInputDto): RebalanceOverviewDto {
    const tradePlanRaw = calculateRebalancePlan({
        assets: input.assets,
        taxProfile: input.taxProfile,
        fees: input.fees
    });
    const tradePlan = toPlanDto(tradePlanRaw);

    const cashOnlyRaw = calculateCashOnlyPlan({assets: input.assets});
    const cashOnlyActions = cashOnlyRaw.buys.map<RebalanceActionDto>((buy) => ({
        id: buy.id,
        action: buy.buyAmount.isZero() ? 'HOLD' : 'BUY',
        amount: buy.buyAmount
    }));

    const tradeActions = tradePlanRaw.assets.map<RebalanceActionDto>((asset) => {
        if (!asset.buyGross.isZero()) {
            return {id: asset.id, action: 'BUY', amount: asset.buyGross};
        }
        if (!asset.sellGross.isZero()) {
            return {id: asset.id, action: 'SELL', amount: asset.sellGross};
        }
        return {id: asset.id, action: 'HOLD', amount: asset.buyGross};
    });

    return {
        optionA_cashOnly: {
            cashNeeded: cashOnlyRaw.cashNeeded,
            buys: cashOnlyRaw.buys,
            actions: cashOnlyActions,
            warnings: cashOnlyRaw.warnings
        },
        optionB_tradeRebalance: {
            cashShortfall: tradePlan.summary.cashShortfall,
            cashSurplus: tradePlan.summary.cashSurplus,
            totalTaxesOnSell: tradePlan.summary.totalTaxesOnSell,
            actions: tradeActions,
            warnings: tradePlan.summary.warnings
        }
    };
}

function toPlanDto(plan: ReturnType<typeof calculateRebalancePlan>): RebalancePlanDto {
    return {
        assets: plan.assets,
        summary: {
            totalBuys: plan.totalBuys,
            totalSellsGross: plan.totalSellsGross,
            totalSellNet: plan.totalSellNet,
            totalTaxesOnSell: plan.totalTaxesOnSell,
            cashShortfall: plan.cashShortfall,
            cashSurplus: plan.cashSurplus,
            warnings: plan.warnings
        }
    };
}

