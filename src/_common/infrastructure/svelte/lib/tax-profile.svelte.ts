import {browser} from '$app/environment';

export interface GlobalTaxProfileState {
    capitalGainsTaxInput: string;
    solidaritySurchargeInput: string;
    churchTaxInput: string;
    remainingSparerPauschbetragInput: string;
}

const STORAGE_KEY = 'global-tax-profile-v1';

const DEFAULTS: GlobalTaxProfileState = {
    capitalGainsTaxInput: '25',
    solidaritySurchargeInput: '5.5',
    churchTaxInput: '0',
    remainingSparerPauschbetragInput: '1000'
};

function sanitizeValue(value: unknown, fallback: string): string {
    return typeof value === 'string' ? value : fallback;
}

function getInitialState(): GlobalTaxProfileState {
    if (!browser) {
        return {...DEFAULTS};
    }

    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return {...DEFAULTS};
        }

        const parsed = JSON.parse(raw) as Partial<GlobalTaxProfileState>;
        return {
            capitalGainsTaxInput: sanitizeValue(parsed.capitalGainsTaxInput, DEFAULTS.capitalGainsTaxInput),
            solidaritySurchargeInput: sanitizeValue(parsed.solidaritySurchargeInput, DEFAULTS.solidaritySurchargeInput),
            churchTaxInput: sanitizeValue(parsed.churchTaxInput, DEFAULTS.churchTaxInput),
            remainingSparerPauschbetragInput: sanitizeValue(
                parsed.remainingSparerPauschbetragInput,
                DEFAULTS.remainingSparerPauschbetragInput
            )
        };
    } catch {
        return {...DEFAULTS};
    }
}

export const globalTaxProfile = $state<GlobalTaxProfileState>(getInitialState());

export function updateGlobalTaxProfile(patch: Partial<GlobalTaxProfileState>): void {
    Object.assign(globalTaxProfile, patch);

    if (browser) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(globalTaxProfile));
    }
}
