import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  formatCompactCurrency as formatCompactCurrencyLocale,
  formatCurrency as formatCurrencyLocale,
  formatPercent as formatPercentLocale,
} from "@/lib/i18n/format";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Locale-fixed wrappers kept for the ~130 existing call sites that don't
 * (yet) have a locale in scope. Prefer importing the locale-aware
 * versions from "@/lib/i18n/format" directly in new or migrated code —
 * these always format as English/USD regardless of the active locale,
 * which is a correctness gap for Spanish-locale students, not a style
 * choice. See future-fixes.md for the migration path.
 */
export function formatCurrency(value: number): string {
  return formatCurrencyLocale(value, "en");
}

/** Financial presentation: $42.9M instead of $42,900,000. */
export function formatCompactCurrency(value: number): string {
  return formatCompactCurrencyLocale(value, "en");
}

export function formatPercent(value: number, decimals = 1): string {
  // Historically this returned "42.5%" from a raw value like 42.5 — kept
  // as a plain string (not Intl's percent style, which needs a 0-1
  // fraction) so the 130 existing callers that pass whole percentages
  // don't silently render 100x too small.
  return `${value.toFixed(decimals)}%`;
}

export {
  formatCompactCurrencyLocale,
  formatCurrencyLocale,
  formatPercentLocale,
};

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
