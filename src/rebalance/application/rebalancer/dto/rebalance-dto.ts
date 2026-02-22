import type {Money} from '$common/domain/types/money';
import type {Percentage} from '$common/domain/types/percentage';
import type {PartialExemptionRate} from '$rebalance/domain/rebalancer/value-objects/partial-exemption-rate';
import type {TaxProfile} from '$rebalance/domain/rebalancer/value-objects/tax-profile';

export interface AssetInputDto {
    id: string;
    marketValueGross: Money;
    targetWeight: Percentage;
    investedCapital?: Money;
    partialExemption?: PartialExemptionRate;
}

export interface FeeProfileDto {
    fixedFee?: Money;
    feeRate?: Percentage;
}

export interface RebalanceInputDto {
    assets: AssetInputDto[];
    taxCountry?: 'NONE' | 'DEU';
    taxProfile?: TaxProfile;
    fees?: FeeProfileDto;
}

export interface AssetTradeResultDto {
    id: string;
    targetValue: Money;
    buyGross: Money;
    sellGross: Money;
    taxOnSell: Money;
    feeOnTrade: Money;
    netProceeds: Money;
}

export interface RebalanceSummaryDto {
    totalBuys: Money;
    totalSellsGross: Money;
    totalSellNet: Money;
    totalTaxesOnSell: Money;
    cashShortfall: Money;
    cashSurplus: Money;
    warnings: string[];
}

export interface RebalancePlanDto {
    assets: AssetTradeResultDto[];
    summary: RebalanceSummaryDto;
}

export interface CashOnlyPlanDto {
    cashNeeded: Money;
    buys: Array<{id: string; buyAmount: Money}>;
    warnings: string[];
}

export interface RebalanceActionDto {
    id: string;
    action: 'BUY' | 'SELL' | 'HOLD';
    amount: Money;
}

export interface CashOnlyOptionDto {
    cashNeeded: Money;
    buys: Array<{id: string; buyAmount: Money}>;
    actions: RebalanceActionDto[];
    warnings: string[];
}

export interface TradeOptionDto {
    cashShortfall: Money;
    cashSurplus: Money;
    totalTaxesOnSell: Money;
    actions: RebalanceActionDto[];
    warnings: string[];
}

export interface RebalanceOverviewDto {
    optionA_cashOnly: CashOnlyOptionDto;
    optionB_tradeRebalance: TradeOptionDto;
}

