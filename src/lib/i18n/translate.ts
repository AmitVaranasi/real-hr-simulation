import { catalogs, type Namespace, type KeyOf } from "./catalogs";
import { DEFAULT_LOCALE, type Locale } from "./config";
import { formatMessage, type MessageVars } from "./messages";

/**
 * Thrown only in development so a missing key fails loudly during local
 * work and CI, instead of shipping a silent gap to production.
 */
export class MissingTranslationError extends Error {
  constructor(locale: Locale, namespace: Namespace, key: string) {
    super(`Missing i18n key "${namespace}.${key}" for locale "${locale}"`);
    this.name = "MissingTranslationError";
  }
}

function isDev(): boolean {
  return process.env.NODE_ENV !== "production";
}

/**
 * Resolves a template string for (locale, namespace, key), falling back
 * to the English catalog in production and throwing in development. A
 * raw translation key is never returned to the caller — the last resort
 * is always readable English text, never `student.join.title.first`.
 */
export function resolveTemplate(
  locale: Locale,
  namespace: Namespace,
  key: string
): string {
  const localeCatalog = catalogs[locale]?.[namespace] as
    | Record<string, string>
    | undefined;
  const value = localeCatalog?.[key];
  if (typeof value === "string") return value;

  if (isDev()) {
    throw new MissingTranslationError(locale, namespace, key);
  }

  const fallback = catalogs[DEFAULT_LOCALE][namespace] as Record<
    string,
    string
  >;
  const fallbackValue = fallback?.[key];
  if (typeof fallbackValue === "string") return fallbackValue;

  // Even the English fallback is missing (a key typo'd or removed from
  // only one catalog). Still never render the raw key to a student.
  return "";
}

/**
 * Translate a namespaced key for the given locale, with `{var}`
 * interpolation and `{var, plural, ...}` pluralization support.
 *
 * Two-argument namespace/key (rather than one dotted "namespace:key"
 * string) keeps the generic types simple and gives real autocomplete:
 * `t(locale, "student", "join.title.first")` narrows `key` to the
 * actual keys of `student.json` via `KeyOf<"student">`.
 */
export function translate<NS extends Namespace>(
  locale: Locale,
  namespace: NS,
  key: KeyOf<NS>,
  vars?: MessageVars
): string {
  const template = resolveTemplate(locale, namespace, key);
  return formatMessage(template, vars, locale);
}

/** Bound translator for a fixed locale — what components normally use. */
export type Translator = <NS extends Namespace>(
  namespace: NS,
  key: KeyOf<NS>,
  vars?: MessageVars
) => string;

export function createTranslator(locale: Locale): Translator {
  return (namespace, key, vars) => translate(locale, namespace, key, vars);
}
