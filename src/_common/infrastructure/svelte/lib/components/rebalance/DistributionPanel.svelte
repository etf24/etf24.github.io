<script lang="ts">
    import type {AllocationRow} from '$rebalance/presentation/rebalancer-ui-state';
    import * as m from '$lib/paraglide/messages';

    let {
        overviewExists,
        allocationRows,
        resultRoundingEnabled,
        formatPercent,
        allocationBarKindLabel
    }: {
        overviewExists: boolean;
        allocationRows: AllocationRow[];
        resultRoundingEnabled: boolean;
        formatPercent: (value: number, roundingEnabled: boolean) => string;
        allocationBarKindLabel: (kind: 'CURRENT' | 'TARGET') => string;
    } = $props();
</script>

<article class="rebalancer-panel">
    <header class="rebalancer-panel__header">
        <h2 class="rebalancer-panel__title">{m.page_rebalancer_distribution_title()}</h2>
    </header>

    {#if overviewExists && allocationRows.length > 0}
        <section class="allocation-chart" aria-label={m.page_rebalancer_allocation_chart_label()}>
            {#each allocationRows as row}
                <article class="allocation-chart__row">
                    <header class="allocation-chart__row-header">
                        <span class="allocation-chart__name">
                            <span class="asset-chip {row.colorToken}"></span>
                            {row.name}
                        </span>
                    </header>
                    <div class="allocation-chart__line">
                        <span class="allocation-chart__kind-label">{allocationBarKindLabel('CURRENT')}</span>
                        <div class="allocation-chart__track">
                            <span
                                class="allocation-chart__bar allocation-chart__bar--current"
                                style={`width:${Math.max(0, Math.min(100, row.currentWeightPercent))}%`}
                            ></span>
                        </div>
                        <span class="allocation-chart__percent-value">
                            {formatPercent(row.currentWeightPercent, resultRoundingEnabled)}
                        </span>
                    </div>
                    <div class="allocation-chart__line">
                        <span class="allocation-chart__kind-label">{allocationBarKindLabel('TARGET')}</span>
                        <div class="allocation-chart__track">
                            <span
                                class={`allocation-chart__bar allocation-chart__bar--target ${row.colorToken}`}
                                style={`width:${Math.max(0, Math.min(100, row.targetWeightPercent))}%`}
                            ></span>
                        </div>
                        <span class="allocation-chart__percent-value">
                            {formatPercent(row.targetWeightPercent, resultRoundingEnabled)}
                        </span>
                    </div>
                </article>
            {/each}
        </section>
    {:else}
        <figure class="placeholder placeholder--medium">
            <figcaption class="placeholder__text">{m.sidebar_empty()}</figcaption>
        </figure>
    {/if}
</article>
