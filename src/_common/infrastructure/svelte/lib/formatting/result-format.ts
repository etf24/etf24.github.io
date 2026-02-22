import type {CurrencyCode} from '$lib/currency.svelte';
import {Money} from '$common/domain/types/money';

export function formatMoney(
    value: Money,
    currencyCode: CurrencyCode,
    roundingEnabled: boolean
): string {
    return formatCents(value.toCents(), currencyCode, roundingEnabled);
}

export function formatCents(
    cents: number,
    currencyCode: CurrencyCode,
    roundingEnabled: boolean
): string {
    const value = roundingEnabled ? Math.round(cents / 100) : cents / 100;
    const formatter = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: roundingEnabled ? 0 : 2,
        maximumFractionDigits: roundingEnabled ? 0 : 2
    });
    const formattedAbs = formatter.format(Math.abs(value));
    const amount = value < 0 ? `-${formattedAbs}` : formattedAbs;

    if (currencyCode === 'EUR') {
        return `${amount}€`;
    }

    if (currencyCode === 'USD') {
        return `$${amount}`;
    }

    return amount;
}

export function formatPercent(value: number, roundingEnabled: boolean): string {
    if (roundingEnabled) {
        return `${Math.round(value)}%`;
    }

    const twoDecimals = value.toFixed(2);
    const trimmed = twoDecimals.replace(/\.00$/, '').replace(/(\.[0-9])0$/, '$1');
    return `${trimmed}%`;
}
