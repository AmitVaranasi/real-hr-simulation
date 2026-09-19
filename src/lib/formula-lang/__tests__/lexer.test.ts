import { describe, expect, it } from "vitest";
import { MAX_EXPRESSION_LENGTH, tokenize } from "../lexer";

function types(source: string): string[] {
  const r = tokenize(source);
  if (!r.ok) throw new Error(`expected ok, got error: ${r.error.message}`);
  return r.tokens.map((t) => t.type);
}

describe("tokenize: happy path", () => {
  it("tokenizes an empty string to just EOF", () => {
    expect(types("")).toEqual(["EOF"]);
  });

  it("tokenizes integers and decimals", () => {
    expect(types("42 3.14")).toEqual(["NUMBER", "NUMBER", "EOF"]);
  });

  it("tokenizes a leading-dot decimal", () => {
    const r = tokenize(".5");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.tokens[0]).toMatchObject({ type: "NUMBER", value: ".5" });
  });

  it("tokenizes identifiers with underscores and digits", () => {
    const r = tokenize("base_budget2");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.tokens[0]).toMatchObject({ type: "IDENT", value: "base_budget2" });
  });

  it("tokenizes all single-char operators", () => {
    expect(types("+ - * / % ^ ( ) ,")).toEqual([
      "PLUS",
      "MINUS",
      "STAR",
      "SLASH",
      "PERCENT",
      "CARET",
      "LPAREN",
      "RPAREN",
      "COMMA",
      "EOF",
    ]);
  });

  it("tokenizes multi-char comparison operators", () => {
    expect(types("< <= > >= == !=")).toEqual([
      "LT",
      "LTE",
      "GT",
      "GTE",
      "EQEQ",
      "NEQ",
      "EOF",
    ]);
  });

  it("skips whitespace including tabs/newlines", () => {
    expect(types("1\t+\n2\r\n")).toEqual(["NUMBER", "PLUS", "NUMBER", "EOF"]);
  });

  it("tracks 1-based columns", () => {
    const r = tokenize("ab + 12");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.tokens.map((t) => t.col)).toEqual([1, 4, 6, 8]);
    }
  });
});

describe("tokenize: errors", () => {
  it("rejects a lone '='", () => {
    const r = tokenize("a = 1");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.col).toBe(3);
      expect(r.error.message).toMatch(/==/);
    }
  });

  it("rejects a lone '!'", () => {
    const r = tokenize("a ! b");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.col).toBe(3);
  });

  it("rejects an unexpected character", () => {
    const r = tokenize("a & b");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.col).toBe(3);
      expect(r.error.message).toContain("&");
    }
  });

  it("rejects a trailing-dot malformed number", () => {
    const r = tokenize("12.");
    expect(r.ok).toBe(false);
  });

  it("rejects input over the max length", () => {
    const r = tokenize("1".repeat(MAX_EXPRESSION_LENGTH + 1));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/too long/);
  });

  it("rejects an absurdly long numeric literal", () => {
    const r = tokenize("1".repeat(80));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/too long/);
  });

  it("rejects an absurdly long identifier", () => {
    const r = tokenize("a".repeat(200));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/too long/);
  });

  it("never throws on non-string input", () => {
    // @ts-expect-error deliberately hostile input
    const r = tokenize(null);
    expect(r.ok).toBe(false);
  });
});
