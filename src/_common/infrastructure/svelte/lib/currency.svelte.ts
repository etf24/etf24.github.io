import {browser} from '$app/environment';

export type CurrencyCode = 'NONE' | 'EUR' | 'USD';

const STORAGE_KEY = 'global-currency';

function sanitizeCurrencyCode(value: string | null): CurrencyCode {
    if (value === 'EUR' || value === 'USD' || value === 'NONE') {
        return value;
    }

    return 'NONE';
}

function getInitialCurrencyCode(): CurrencyCode {
    if (!browser) {
        return 'NONE';
    }

    return sanitizeCurrencyCode(localStorage.getItem(STORAGE_KEY));
}

export const currency = $state<{code: CurrencyCode}>({
    code: getInitialCurrencyCode()
});

export function applyCurrencyCode(code: CurrencyCode): void {
    currency.code = code;
    if (browser) {
        localStorage.setItem(STORAGE_KEY, code);
    }
}
