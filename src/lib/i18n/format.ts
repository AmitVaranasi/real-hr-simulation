import type { Locale } from "./config";

/**
 * Locale-aware number/currency/percent/date formatting. This is the
 * shared home for formatting so callers (src/lib/utils.ts,
 * src/lib/reports/statement-data.ts, and future call sites) don't
 * hand-roll `toFixed`/`toLocaleString("en-US")` again — which is a
 * correctness bug for a Spanish-locale student reading a financial
 * statement, not cosmetics. The currency is always USD (the simulation
 * doesn't model other currencies); only the digit grouping, decimal
 * mark, and symbol placement change with locale — `Intl.NumberFormat`
 * already knows es uses "." for grouping and "," for the decimal mark.
 */

const BCP47: Record<Locale, string> = {
  en: "en-US",
  es: "es-ES",
};

function tag(locale: Locale): string {
  return BCP47[locale] ?? "en-US";
}

export function formatCurrency(value: number, locale: Locale = "en"): string {
  return new Intl.NumberFormat(tag(locale), {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Financial presentation: $42.9M instead of $42,900,000, locale-aware. */
export function formatCompactCurrency(
  value: number,
  locale: Locale = "en"
): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  const nf = (fractionDigits: number) =>
    new Intl.NumberFormat(tag(locale), {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });

  if (abs >= 1_000_000_000) {
    return `${sign}$${nf(1).format(abs / 1_000_000_000)}B`;
  }
  if (abs >= 1_000_000) {
    return `${sign}$${nf(1).format(abs / 1_000_000)}M`;
  }
  if (abs >= 10_000) {
    return `${sign}$${nf(1).format(abs / 1_000)}K`;
  }
  return formatCurrency(value, locale);
}

export function formatPercent(
  value: number,
  decimals = 1,
  locale: Locale = "en"
): string {
  // `value` is already a percentage number (e.g. 42.5, not 0.425), so we
  // divide by 100 to hand Intl's percent style the fraction it expects.
  return new Intl.NumberFormat(tag(locale), {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

export function formatDate(
  value: string | Date | null | undefined,
  locale: Locale = "en",
  options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  }
): string | null {
  if (!value) return null;
  try {
    const date = typeof value === "string" ? new Date(value) : value;
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat(tag(locale), options).format(date);
  } catch {
    return null;
  }
}
