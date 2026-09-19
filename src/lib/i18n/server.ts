import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, isLocale, type Locale } from "./config";
import { resolveLocale } from "./resolve";
import { createTranslator, type Translator } from "./translate";

/**
 * Resolves the active locale for the current request in a Server
 * Component or Route Handler. Precedence: signed-in profile preference
 * (passed in by the caller, since it requires a Supabase round trip we
 * don't want to force on every call) > locale cookie > Accept-Language
 * > default. Most call sites only need cookie + header, so
 * `profileLocale` is optional.
 */
export async function getServerLocale(
  profileLocale?: string | null
): Promise<Locale> {
  if (isLocale(profileLocale)) {
    return profileLocale;
  }

  const cookieStore = await cookies();
  const headerStore = await headers();
  return resolveLocale({
    cookieLocale: cookieStore.get(LOCALE_COOKIE)?.value,
    acceptLanguageHeader: headerStore.get("accept-language"),
  });
}

export async function getServerTranslator(
  profileLocale?: string | null
): Promise<{ locale: Locale; t: Translator }> {
  const locale = await getServerLocale(profileLocale);
  return { locale, t: createTranslator(locale) };
}
