import {browser} from '$app/environment';

export interface GlobalTaxProfileState {
    capitalGainsTaxInput: string;
    solidaritySurchargeInput: string;
    churchTaxInput: string;
    remainingSparerPauschbetragInput: string;
}

const STORAGE_KEY = 'global-tax-profile-v1';

export const GLOBAL_TAX_PROFILE_DEFAULTS: GlobalTaxProfileState = {
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
        return {...GLOBAL_TAX_PROFILE_DEFAULTS};
    }

    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return {...GLOBAL_TAX_PROFILE_DEFAULTS};
        }

        const parsed = JSON.parse(raw) as Partial<GlobalTaxProfileState>;
        return {
            capitalGainsTaxInput: sanitizeValue(
                parsed.capitalGainsTaxInput,
                GLOBAL_TAX_PROFILE_DEFAULTS.capitalGainsTaxInput
            ),
            solidaritySurchargeInput: sanitizeValue(
                parsed.solidaritySurchargeInput,
                GLOBAL_TAX_PROFILE_DEFAULTS.solidaritySurchargeInput
            ),
            churchTaxInput: sanitizeValue(parsed.churchTaxInput, GLOBAL_TAX_PROFILE_DEFAULTS.churchTaxInput),
            remainingSparerPauschbetragInput: sanitizeValue(
                parsed.remainingSparerPauschbetragInput,
                GLOBAL_TAX_PROFILE_DEFAULTS.remainingSparerPauschbetragInput
            )
        };
    } catch {
        return {...GLOBAL_TAX_PROFILE_DEFAULTS};
    }
}

export const globalTaxProfile = $state<GlobalTaxProfileState>(getInitialState());

export function updateGlobalTaxProfile(patch: Partial<GlobalTaxProfileState>): void {
    Object.assign(globalTaxProfile, patch);

    if (browser) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(globalTaxProfile));
    }
}
