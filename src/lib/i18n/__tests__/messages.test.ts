import { describe, expect, it } from "vitest";
import { formatMessage } from "../messages";

describe("formatMessage: interpolation", () => {
  it("substitutes a simple {var}", () => {
    expect(formatMessage("Hello {name}", { name: "Ana" }, "en")).toBe(
      "Hello Ana"
    );
  });

  it("substitutes multiple variables", () => {
    expect(
      formatMessage("{a} and {b}", { a: "one", b: "two" }, "en")
    ).toBe("one and two");
  });

  it("leaves the placeholder literally when the variable is missing", () => {
    expect(formatMessage("Hello {name}", {}, "en")).toBe("Hello {name}");
  });

  it("coerces numeric variables to strings", () => {
    expect(formatMessage("Score: {score}", { score: 42 }, "en")).toBe(
      "Score: 42"
    );
  });
});

describe("formatMessage: plural (en)", () => {
  const template =
    "{count, plural, =0 {No rounds completed yet} one {# round completed} other {# rounds completed}}";

  it("selects the exact =0 case over the plural category", () => {
    expect(formatMessage(template, { count: 0 }, "en")).toBe(
      "No rounds completed yet"
    );
  });

  it("selects the 'one' category for count=1", () => {
    expect(formatMessage(template, { count: 1 }, "en")).toBe(
      "1 round completed"
    );
  });

  it("selects the 'other' category for count>1", () => {
    expect(formatMessage(template, { count: 5 }, "en")).toBe(
      "5 rounds completed"
    );
  });

  it("selects the 'other' category for large counts and formats with grouping", () => {
    expect(formatMessage(template, { count: 12000 }, "en")).toBe(
      "12,000 rounds completed"
    );
  });
});

describe("formatMessage: plural (es)", () => {
  const template =
    "{count, plural, =0 {Ninguna ronda completada aún} one {# ronda completada} other {# rondas completadas}}";

  it("selects the exact =0 case", () => {
    expect(formatMessage(template, { count: 0 }, "es")).toBe(
      "Ninguna ronda completada aún"
    );
  });

  it("selects 'one' for count=1 (Spanish also uses one/other, unlike e.g. Arabic)", () => {
    expect(formatMessage(template, { count: 1 }, "es")).toBe(
      "1 ronda completada"
    );
  });

  it("selects 'other' for count>1 and formats with Spanish grouping", () => {
    expect(formatMessage(template, { count: 12000 }, "es")).toBe(
      "12.000 rondas completadas"
    );
  });

  it("en and es diverge in wording for the same count", () => {
    const enTemplate =
      "{count, plural, =0 {No rounds completed yet} one {# round completed} other {# rounds completed}}";
    const en = formatMessage(enTemplate, { count: 3 }, "en");
    const es = formatMessage(template, { count: 3 }, "es");
    expect(en).not.toBe(es);
    expect(en).toBe("3 rounds completed");
    expect(es).toBe("3 rondas completadas");
  });
});

describe("formatMessage: plural without an exact-match case", () => {
  it("falls back to the plural category when no =N case is defined", () => {
    const template = "{count, plural, one {# item} other {# items}}";
    expect(formatMessage(template, { count: 0 }, "en")).toBe("0 items");
    expect(formatMessage(template, { count: 1 }, "en")).toBe("1 item");
  });
});
