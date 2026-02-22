import {browser} from '$app/environment';

const STORAGE_KEY = 'global-result-rounding-enabled';

function getInitialResultRoundingEnabled(): boolean {
    if (!browser) {
        return false;
    }

    return localStorage.getItem(STORAGE_KEY) === 'true';
}

export const resultRounding = $state<{enabled: boolean}>({
    enabled: getInitialResultRoundingEnabled()
});

export function applyResultRoundingEnabled(enabled: boolean): void {
    resultRounding.enabled = enabled;
    if (browser) {
        localStorage.setItem(STORAGE_KEY, String(enabled));
    }
}
