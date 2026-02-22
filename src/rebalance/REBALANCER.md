# Rebalancer Feature Reference

This document describes the current implementation status of the rebalancer feature in `src/rebalance`.
It is meant as a handover and continuation reference for future sessions.

## Scope (Current State)

The current implementation provides:
- A query-style use case that returns a complete overview DTO for the UI.
- Trade-based rebalance calculations (buy and sell deltas).
- Optional tax and fee handling on sell operations.
- Cash-only rebalance plan calculation (no sells).
- Optional months-to-target calculation from monthly savings.

The current implementation does not yet provide:
- Multi-currency support.
- Tax lot models (FIFO/LIFO); realized gain is proportional average-cost style.
- Per-country tax engines beyond the currently modeled tax profile inputs.
- UI-specific behavior documentation (this file is domain/application focused).

## Architecture Placement

Feature root:
- `src/rebalance`

Current sub-structure:
- `src/rebalance/domain/rebalancer`
- `src/rebalance/application/rebalancer`
- `src/rebalance/infrastructure` (reserved for adapters, currently empty)

Shared cross-feature primitives used here:
- `src/_common/domain/types/money.ts`
- `src/_common/domain/types/percentage.ts`
- `src/_common/domain/math/rounding.ts`

## Public API Surface

Domain exports:
- `src/rebalance/domain/rebalancer/index.ts`

Application exports:
- `src/rebalance/application/rebalancer/index.ts`

Main application entry point:
- `calculateRebalanceOverview(...)` from
  `src/rebalance/application/rebalancer/use-cases/calculate-rebalance.ts`

## Domain Value Objects

### `PartialExemptionRate`
File: `src/rebalance/domain/rebalancer/value-objects/partial-exemption-rate.ts`

- Allowed values: `0`, `15`, `30` percent.
- Constructor is private; use `fromPercent(0 | 15 | 30)`.
- `none()` returns `0%`.

### `TaxProfile`
File: `src/rebalance/domain/rebalancer/value-objects/tax-profile.ts`

Fields:
- `capitalGainsTax: Percentage`
- `solidaritySurcharge: Percentage`
- `churchTax: Percentage`
- `roundingMode: 'CENT' | 'EURO'`

Factory:
- `createTaxProfile(...)`
- Defaults:
  - `solidaritySurcharge = 0%`
  - `churchTax = 0%`
  - `roundingMode = 'CENT'`

## Core Domain Service

File: `src/rebalance/domain/rebalancer/services/rebalance-service.ts`

### 1. `calculateRebalancePlan(...)`

Input:
- `assets: AssetCalculationInput[]`
- `taxProfile?: TaxProfile`
- `fees?: FeeProfile`

Per-asset input fields:
- `id: string`
- `marketValueGross: Money`
- `targetWeight: Percentage`
- `investedCapital?: Money`
- `partialExemption?: PartialExemptionRate`

Output:
- `RebalancePlanResult`
- Per-asset buy/sell/tax/fee/net fields
- Portfolio summary totals and warnings

Computation logic:
- `totalGross` is sum of all `marketValueGross`.
- Target weights are normalized to 100% when needed.
- For each asset:
  - `targetValue = totalGross * targetWeight`
  - `delta = targetValue - marketValueGross`
  - `delta > 0` => buy
  - `delta < 0` => sell
- Fees are applied to either buy or sell gross amount when configured.
- Tax is only computed on sells.

Sell-side tax logic:
- `investedCapital` defaults to `marketValueGross` if omitted.
- `unrealizedGain = marketValueGross - investedCapital`
- `realizedGain` on partial sell is proportional:
  - `sellGross * unrealizedGain / marketValueGross`
- Negative realized gain is clamped to zero for taxation.
- `taxBase = taxableGain * (1 - partialExemption)`
- `taxAmount = capTax + solidarity + church`
  - solidarity and church are calculated as surcharges on capital gains tax.

Rounding behavior:
- If `taxProfile.roundingMode === 'EURO'`, tax is rounded to full euros
  using the shared default rounding mode (`HALF_UP`) and converted back to cents.
- Otherwise calculations remain cent-level.

Portfolio-level summary:
- `totalBuys` includes buy gross plus buy-side fee.
- `totalSellsGross` is raw sell amount.
- `totalSellNet` is sell gross minus sell tax and sell fee.
- `cashBalance = totalSellNet - totalBuys`
- Negative cash balance => `cashShortfall`
- Positive cash balance => `cashSurplus`

Warnings currently emitted:
- `NO_ASSETS`
- `ASSET_LIMIT_EXCEEDED` (over 10 assets)
- `TARGET_WEIGHTS_ZERO`
- `TARGET_WEIGHTS_NORMALIZED`

### 2. `calculateCashOnlyPlan(...)`

Input:
- `assets: AssetCalculationInput[]`

Output:
- `cashNeeded: Money`
- `buys: Array<{id: string; buyAmount: Money}>`
- `warnings: string[]`

Computation logic:
- Computes required fresh capital without selling.
- Uses iterative convergence (max 100 iterations).
- Emits `CASH_ONLY_NOT_CONVERGED` if not stable by iteration 100.
- Uses normalized target weights.

### 3. `calculateMonthsToTarget(...)`

Input:
- `cashNeeded: Money`
- `monthlySavings: Money`

Output:
- `number | null`

Behavior:
- Returns `null` if monthly savings is zero.
- Else returns `ceil(cashNeeded / monthlySavings)`.

## Application Layer

File: `src/rebalance/application/rebalancer/use-cases/calculate-rebalance.ts`

Use case:
- `calculateRebalanceOverview(input)`

Input:
- `RebalanceInputDto`
- Optional `monthlySavings`

Output:
- `RebalanceOverviewDto`
  - `tradePlan`
  - `cashOnlyPlan`
  - optional `monthsToTarget`

This use case is a composition layer:
- Calls domain services.
- Maps domain result to presentation-ready DTO shape.
- Does not embed UI logic.

## DTO Contracts

File: `src/rebalance/application/rebalancer/dto/rebalance-dto.ts`

Main DTOs:
- `AssetInputDto`
- `FeeProfileDto`
- `RebalanceInputDto`
- `AssetTradeResultDto`
- `RebalanceSummaryDto`
- `RebalancePlanDto`
- `CashOnlyPlanDto`
- `MonthsToTargetDto`
- `RebalanceOverviewDto`

## Current Test Coverage

Domain tests:
- `src/rebalance/domain/rebalancer/services/rebalance-service.test.ts`

Covered scenarios:
- Tax calculation on partial sell with 30% partial exemption.
- Loss case not taxed.
- Full-euro tax rounding mode.
- Target-weight normalization warning.

Application test:
- `src/rebalance/application/rebalancer/use-cases/calculate-rebalance.test.ts`

Covered scenario:
- Combined output contains trade plan, cash-only plan, and months-to-target.

## Known Design Choices and Constraints

- Money is integer minor units (cents) only.
- No currency code in `Money` yet.
- Proportional realized-gain model is used for partial sells.
- Assets above 10 are allowed but flagged with warning.
- Input validation and user-facing error UX are not defined in this file.

## Next Iteration Candidates

Potential next steps (not implemented yet):
- Extract warning strings into typed constants or a warning enum.
- Add explicit test scenarios for fee combinations (fixed + rate on buy/sell).
- Add property-based tests for normalization and cash-only convergence.
- Formalize tax calculation assumptions in a dedicated tax-spec markdown.
- Add scenario fixtures for larger portfolios and edge values.
