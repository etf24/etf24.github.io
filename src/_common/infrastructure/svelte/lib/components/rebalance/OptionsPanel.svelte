<script lang="ts">
    import type {Money} from '$common/domain/types/money';
    import type {RebalanceOverviewDto} from '$rebalance/application/rebalancer/dto/rebalance-dto';
    import type {UiActionRow} from '$rebalance/presentation/rebalancer-ui-state';
    import type {CurrencyCode} from '$lib/currency.svelte';
    import type {TaxCountryCode} from '$lib/country.svelte';
    import * as m from '$lib/paraglide/messages';

    let {
        overview,
        optionACashActions,
        optionBTradeActions,
        selectedOption,
        currencyCode,
        taxCountryCode,
        resultRoundingEnabled,
        onSelectOption,
        formatMoney,
        actionLabel,
        actionClass,
        actionNote
    }: {
        overview: RebalanceOverviewDto | null;
        optionACashActions: UiActionRow[];
        optionBTradeActions: UiActionRow[];
        selectedOption: 'A' | 'B';
        currencyCode: CurrencyCode;
        taxCountryCode: TaxCountryCode;
        resultRoundingEnabled: boolean;
        onSelectOption: (option: 'A' | 'B') => void;
        formatMoney: (value: Money, currencyCode: CurrencyCode, roundingEnabled: boolean) => string;
        actionLabel: (action: 'BUY' | 'SELL' | 'HOLD') => string;
        actionClass: (action: 'BUY' | 'SELL' | 'HOLD') => string;
        actionNote: (action: 'BUY' | 'SELL' | 'HOLD') => string;
    } = $props();
</script>

<article class="rebalancer-panel">
    <header class="rebalancer-panel__header">
        <h2 class="rebalancer-panel__title">{m.page_rebalancer_options_title()}</h2>
    </header>

    {#if overview}
        <section class="result-stack">
            <div
                class="option-section {selectedOption === 'A' ? 'option-section--active' : ''}"
                role="button"
                tabindex="0"
                onclick={() => onSelectOption('A')}
                onkeydown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        onSelectOption('A');
                    }
                }}
            >
                <h3 class="result-card__title">{m.page_rebalancer_result_cash_only_title()}</h3>
                <p class="result-card__metric">
                    {formatMoney(overview.optionA_cashOnly.cashNeeded, currencyCode, resultRoundingEnabled)}
                </p>

                <section class="result-actions">
                    <h3 class="result-actions__title">{m.page_rebalancer_option_cash_only_actions()}</h3>
                    <table class="result-actions__table">
                        <thead>
                            <tr>
                                <th>{m.page_rebalancer_action_asset()}</th>
                                <th>{m.page_rebalancer_action_kind()}</th>
                                <th>{m.page_rebalancer_action_amount()}</th>
                                <th>{m.page_rebalancer_action_note()}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each optionACashActions as row}
                                <tr>
                                    <td>
                                        <span class="result-actions__asset">
                                            <span class="asset-chip {row.colorToken}"></span>
                                            {row.name}
                                        </span>
                                    </td>
                                    <td><span class={actionClass(row.action)}>{actionLabel(row.action)}</span></td>
                                    <td>{formatMoney(row.amount, currencyCode, resultRoundingEnabled)}</td>
                                    <td>{actionNote(row.action)}</td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </section>
            </div>

            <div
                class="option-section {selectedOption === 'B' ? 'option-section--active' : ''}"
                role="button"
                tabindex="0"
                onclick={() => onSelectOption('B')}
                onkeydown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        onSelectOption('B');
                    }
                }}
            >
                <h3 class="result-card__title">{m.page_rebalancer_result_trade_title()}</h3>
                <p class="result-card__meta">
                    {m.page_rebalancer_trade_shortfall_label()}
                    {formatMoney(overview.optionB_tradeRebalance.cashShortfall, currencyCode, resultRoundingEnabled)}
                </p>
                <p class="result-card__meta">
                    {m.page_rebalancer_trade_surplus_label()}
                    {formatMoney(overview.optionB_tradeRebalance.cashSurplus, currencyCode, resultRoundingEnabled)}
                </p>
                {#if taxCountryCode === 'DEU'}
                    <p
                        class="result-card__tax {overview.optionB_tradeRebalance.totalTaxesOnSell.isZero()
                            ? 'result-card__tax--neutral'
                            : ''}"
                    >
                        {m.page_rebalancer_trade_tax_total_label()}
                        {#if resultRoundingEnabled &&
                            overview.optionB_tradeRebalance.totalTaxesOnSell.toCents() > 0 &&
                            Math.round(overview.optionB_tradeRebalance.totalTaxesOnSell.toCents() / 100) === 0}
                            {currencyCode === 'EUR' ? '<1€' : currencyCode === 'USD' ? '<$1' : '<1'}
                        {:else}
                            {formatMoney(
                                overview.optionB_tradeRebalance.totalTaxesOnSell,
                                currencyCode,
                                resultRoundingEnabled
                            )}
                        {/if}
                    </p>
                {/if}

                <section class="result-actions">
                    <table class="result-actions__table">
                        <thead>
                            <tr>
                                <th>{m.page_rebalancer_action_asset()}</th>
                                <th>{m.page_rebalancer_action_kind()}</th>
                                <th>{m.page_rebalancer_action_amount()}</th>
                                <th>{m.page_rebalancer_action_note()}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each optionBTradeActions as row}
                                <tr>
                                    <td>
                                        <span class="result-actions__asset">
                                            <span class="asset-chip {row.colorToken}"></span>
                                            {row.name}
                                        </span>
                                    </td>
                                    <td><span class={actionClass(row.action)}>{actionLabel(row.action)}</span></td>
                                    <td>{formatMoney(row.amount, currencyCode, resultRoundingEnabled)}</td>
                                    <td>{actionNote(row.action)}</td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </section>
            </div>
        </section>
    {:else}
        <figure class="placeholder placeholder--medium">
            <figcaption class="placeholder__text">{m.sidebar_empty()}</figcaption>
        </figure>
    {/if}
</article>
