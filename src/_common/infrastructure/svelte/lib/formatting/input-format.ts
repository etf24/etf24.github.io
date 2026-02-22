export function stripGroupingSeparators(value: string): string {
    return value.replace(/,/g, '');
}

export function formatNumericInputForBlur(value: string, maxFractionDigits = 2): string {
    const raw = value.trim();
    if (!raw) {
        return '';
    }

    const normalized = raw.replace(',', '.');
    const numeric = Number(normalized);
    if (!Number.isFinite(numeric)) {
        return value;
    }

    const [, decimals = ''] = normalized.split('.');
    const fractionDigits = Math.min(decimals.length, maxFractionDigits);

    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits
    }).format(numeric);
}
