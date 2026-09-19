"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { LOCALE_COOKIE, type Locale } from "./config";
import { createTranslator, type Translator } from "./translate";

type LocaleContextValue = {
  locale: Locale;
  t: Translator;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * Client-side locale context. `initialLocale` is passed down from the
 * Server Component that resolved it (cookie / Accept-Language / default)
 * so there is a single source of truth per request — the client never
 * re-resolves independently and risks flashing the wrong language.
 */
export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const t = useMemo(() => createTranslator(initialLocale), [initialLocale]);

  const setLocale = useCallback((next: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    // Best-effort: persist to profiles.locale for signed-in users so the
    // preference follows them to another device. The cookie above is
    // what actually takes effect on this device/reload, so a failure or
    // slow response here must never block the switch.
    fetch("/api/user/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: next }),
      keepalive: true,
    }).catch(() => {});
    // A locale switch changes text resolved during Server Component
    // rendering too, so a full reload is the simplest correct approach
    // rather than trying to re-render the RSC tree client-side.
    window.location.reload();
  }, []);

  const value = useMemo(
    () => ({ locale: initialLocale, t, setLocale }),
    [initialLocale, t, setLocale]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale() must be used within a <LocaleProvider>");
  }
  return ctx;
}

/** Convenience hook for components that only need `t`. */
export function useTranslation(): Translator {
  return useLocale().t;
}
