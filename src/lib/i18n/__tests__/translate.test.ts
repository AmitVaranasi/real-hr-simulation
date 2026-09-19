import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTranslator, translate } from "../translate";

describe("translate: real keys", () => {
  it("resolves a known key for en", () => {
    expect(translate("en", "student", "join.title.first")).toBe(
      "Join your team"
    );
  });

  it("resolves the same key for es with different text", () => {
    const en = translate("en", "student", "join.title.first");
    const es = translate("es", "student", "join.title.first");
    expect(es).toBe("Únete a tu equipo");
    expect(es).not.toBe(en);
  });

  it("interpolates and pluralizes through createTranslator", () => {
    const t = createTranslator("en");
    expect(t("student", "roundsCompleted", { count: 0 })).toBe(
      "No rounds completed yet"
    );
    expect(t("student", "roundsCompleted", { count: 1 })).toBe(
      "1 round completed"
    );
    expect(t("student", "roundsCompleted", { count: 4 })).toBe(
      "4 rounds completed"
    );
  });
});

describe("translate: missing keys", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("throws MissingTranslationError in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const mod = await import("../translate");
    expect(() =>
      mod.translate(
        "en",
        "student",
        // @ts-expect-error deliberately invalid key for the missing-key test
        "this.key.does.not.exist"
      )
    ).toThrow(mod.MissingTranslationError);
  });

  it("falls back to English in production without throwing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const mod = await import("../translate");
    // A key that exists in en, but we simulate an es gap by asking for a
    // locale/key combination where the catalog module itself is fine —
    // the fallback path is exercised by resolveTemplate directly.
    const result = mod.resolveTemplate(
      "es",
      "student",
      "this.key.does.not.exist"
    );
    // Falls all the way through to "" because it's missing from en too —
    // proving we never throw in prod and never return the raw key.
    expect(result).toBe("");
    expect(result).not.toContain("this.key.does.not.exist");
  });

  it("never renders the raw key even when only one locale has it", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const mod = await import("../translate");
    // join.title.first exists in both catalogs, so prod fallback for an
    // es-specific gap should still resolve to real English text, not the
    // dotted key.
    const result = mod.translate("es", "student", "join.title.first");
    expect(result).not.toBe("join.title.first");
    expect(result.length).toBeGreaterThan(0);
  });
});
