import {browser} from '$app/environment';

export type TaxCountryCode = 'NONE' | 'DEU';

const STORAGE_KEY = 'global-tax-country';

function sanitizeTaxCountryCode(value: string | null): TaxCountryCode {
    if (value === 'DEU' || value === 'NONE') {
        return value;
    }

    return 'DEU';
}

function getInitialTaxCountryCode(): TaxCountryCode {
    if (!browser) {
        return 'DEU';
    }

    return sanitizeTaxCountryCode(localStorage.getItem(STORAGE_KEY));
}

export const taxCountry = $state<{code: TaxCountryCode}>({
    code: getInitialTaxCountryCode()
});

export function applyTaxCountryCode(code: TaxCountryCode): void {
    taxCountry.code = code;
    if (browser) {
        localStorage.setItem(STORAGE_KEY, code);
    }
}
