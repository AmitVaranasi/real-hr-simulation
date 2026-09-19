"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";
import { LOCALES } from "@/lib/i18n/config";

const LABELS: Record<string, string> = {
  en: "EN",
  es: "ES",
};

/** Explicit locale preference control — this is the "user preference"
 * step of the resolution order (preference > Accept-Language > default).
 * Kept deliberately small so it drops into portal chrome anywhere. */
export function LocaleSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex items-center gap-0.5 rounded-full border border-[var(--portal-sidebar-border)] bg-white p-0.5 text-xs font-medium"
    >
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          aria-pressed={locale === code}
          className={`rounded-full px-2 py-1 transition-colors ${
            locale === code
              ? "bg-[var(--portal-primary)] text-white"
              : "text-[var(--portal-muted)] hover:bg-[var(--portal-page)]"
          }`}
        >
          {LABELS[code] ?? code}
        </button>
      ))}
    </div>
  );
}
