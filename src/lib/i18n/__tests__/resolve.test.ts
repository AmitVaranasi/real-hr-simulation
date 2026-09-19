import { describe, expect, it } from "vitest";
import { pickLocaleFromAcceptLanguage, resolveLocale } from "../resolve";

describe("resolveLocale precedence", () => {
  it("prefers the cookie over Accept-Language", () => {
    expect(
      resolveLocale({
        cookieLocale: "es",
        acceptLanguageHeader: "en-US,en;q=0.9",
      })
    ).toBe("es");
  });

  it("falls back to Accept-Language when there is no cookie", () => {
    expect(
      resolveLocale({
        cookieLocale: null,
        acceptLanguageHeader: "es-MX,es;q=0.9,en;q=0.8",
      })
    ).toBe("es");
  });

  it("falls back to the default locale when neither is present", () => {
    expect(
      resolveLocale({ cookieLocale: null, acceptLanguageHeader: null })
    ).toBe("en");
  });

  it("ignores an invalid cookie value and falls through to the header", () => {
    expect(
      resolveLocale({
        cookieLocale: "fr",
        acceptLanguageHeader: "es;q=0.9",
      })
    ).toBe("es");
  });
});

describe("pickLocaleFromAcceptLanguage", () => {
  it("respects quality values, picking the highest-q supported locale", () => {
    expect(
      pickLocaleFromAcceptLanguage("fr;q=0.9,es;q=0.5,en;q=0.3")
    ).toBe("es");
  });

  it("matches a region-tagged locale to its base language", () => {
    expect(pickLocaleFromAcceptLanguage("es-AR")).toBe("es");
  });

  it("returns null when nothing supported is present", () => {
    expect(pickLocaleFromAcceptLanguage("fr-FR,de;q=0.8")).toBeNull();
  });

  it("returns null for an empty header", () => {
    expect(pickLocaleFromAcceptLanguage(null)).toBeNull();
    expect(pickLocaleFromAcceptLanguage(undefined)).toBeNull();
  });
});
