import { DEFAULT_LOCALE, isLocale, type Locale } from "./config";

/**
 * Precedence: explicit user preference (cookie) > Accept-Language header
 * > default locale. This is the one place that order is encoded — both
 * the server resolver and the middleware call into it so the rule can't
 * drift between the two.
 */
export function resolveLocale(input: {
  cookieLocale?: string | null;
  acceptLanguageHeader?: string | null;
}): Locale {
  if (isLocale(input.cookieLocale)) {
    return input.cookieLocale;
  }

  const fromHeader = pickLocaleFromAcceptLanguage(input.acceptLanguageHeader);
  if (fromHeader) return fromHeader;

  return DEFAULT_LOCALE;
}

/**
 * Parses a raw `Accept-Language` header (e.g. "es-MX,es;q=0.9,en;q=0.8")
 * into our supported locales, respecting quality values and matching by
 * base language (`es-MX` -> `es`).
 */
export function pickLocaleFromAcceptLanguage(
  header: string | null | undefined
): Locale | null {
  if (!header) return null;

  const entries = header
    .split(",")
    .map((part) => {
      const [rawTag, ...params] = part.trim().split(";");
      const qParam = params.find((p) => p.trim().startsWith("q="));
      const q = qParam ? parseFloat(qParam.split("=")[1]) : 1;
      return { tag: rawTag.trim().toLowerCase(), q: Number.isNaN(q) ? 1 : q };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of entries) {
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return null;
}
