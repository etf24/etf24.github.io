import {browser} from '$app/environment';
import {
    availableLanguageTags,
    languageTag,
    setLanguageTag,
    type AvailableLanguageTag,
} from '$lib/paraglide/runtime';

export type LanguageMode = 'en' | 'auto' | 'de';

const LANGUAGE_STORAGE_KEY = 'language-mode';

function resolveAutoLanguage(): AvailableLanguageTag {
    if (!browser) {
        return languageTag();
    }

    const candidates = [...navigator.languages, navigator.language]
        .filter((value): value is string => typeof value === 'string' && value.length > 0)
        .map((value) => value.toLowerCase());

    for (const candidate of candidates) {
        if (candidate.startsWith('de')) {
            return 'de';
        }
    }

    return 'en';
}

function sanitizeLanguageTag(value: string): AvailableLanguageTag {
    return availableLanguageTags.includes(value as AvailableLanguageTag) ? (value as AvailableLanguageTag) : 'en';
}

function sanitizeLanguageMode(value: string | null): LanguageMode {
    if (value === 'auto' || value === 'de' || value === 'en') {
        return value;
    }

    return 'auto';
}

function resolveFromMode(mode: LanguageMode): AvailableLanguageTag {
    if (mode === 'auto') {
        return resolveAutoLanguage();
    }

    return sanitizeLanguageTag(mode);
}

function getInitialState(): {mode: LanguageMode; current: AvailableLanguageTag} {
    const fallback = sanitizeLanguageTag(languageTag());
    if (!browser) {
        return {mode: 'auto', current: fallback};
    }

    const storedMode = sanitizeLanguageMode(localStorage.getItem(LANGUAGE_STORAGE_KEY));
    const current = resolveFromMode(storedMode);
    return {mode: storedMode, current};
}

const initial = getInitialState();
setLanguageTag(initial.current);

export const lang = $state<{mode: LanguageMode; current: AvailableLanguageTag}>({
    mode: initial.mode,
    current: initial.current,
});

export function applyLanguageMode(mode: LanguageMode): void {
    const next = resolveFromMode(mode);
    lang.mode = mode;
    lang.current = next;
    setLanguageTag(next);

    if (browser) {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, mode);
    }
}
