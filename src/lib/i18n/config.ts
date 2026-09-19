/**
 * Locale configuration. English is the source locale content is authored
 * in; Spanish is the only other locale we ship translations for today.
 * Adding a locale means: add it here, add a src/locales/<locale>/*.json
 * set, and the rest of the system (resolution, formatting, t()) picks it
 * up without further changes.
 */
export const LOCALES = ["en", "es"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

/** Name of the cookie used to persist an explicit user locale preference. */
export const LOCALE_COOKIE = "hrsim_locale";
