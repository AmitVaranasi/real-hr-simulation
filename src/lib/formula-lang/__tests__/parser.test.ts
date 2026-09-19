import { describe, expect, it } from "vitest";
import { parse } from "../parser";
import { print } from "../printer";
import { MAX_AST_NODES } from "../ast";

function printOf(source: string): string {
  const r = parse(source);
  if (!r.ok) throw new Error(`expected ok, got: ${r.error.message}`);
  return print(r.ast);
}

describe("parse: precedence and associativity", () => {
  it("multiplication binds tighter than addition", () => {
    expect(printOf("1 + 2 * 3")).toBe("(1 + (2 * 3))");
  });

  it("addition/subtraction are left-associative", () => {
    expect(printOf("1 - 2 - 3")).toBe("((1 - 2) - 3)");
  });

  it("multiplication/division are left-associative", () => {
    expect(printOf("8 / 4 / 2")).toBe("((8 / 4) / 2)");
  });

  it("power is right-associative", () => {
    expect(printOf("2 ^ 3 ^ 2")).toBe("(2 ^ (3 ^ 2))");
  });

  it("power binds tighter than unary minus", () => {
    expect(printOf("-2 ^ 2")).toBe("(-(2 ^ 2))");
  });

  it("unary minus binds tighter than multiplication", () => {
    expect(printOf("-2 * 3")).toBe("((-2) * 3)");
  });

  it("parens override default precedence", () => {
    expect(printOf("(1 + 2) * 3")).toBe("((1 + 2) * 3)");
  });

  it("comparisons bind loosest", () => {
    expect(printOf("1 + 2 > 2 * 1")).toBe("((1 + 2) > (2 * 1))");
  });

  it("double unary minus is legal", () => {
    expect(printOf("--5")).toBe("(-(-5))");
  });

  it("unary plus is legal and distinct from binary plus", () => {
    expect(printOf("+5")).toBe("(+5)");
  });

  it("modulo has multiplicative precedence", () => {
    expect(printOf("10 % 3 + 1")).toBe("((10 % 3) + 1)");
  });
});

describe("parse: function calls", () => {
  it("parses zero, one, and multi-arg calls", () => {
    expect(printOf("abs(x)")).toBe("abs(x)");
    expect(printOf("clamp(x, 0, 1)")).toBe("clamp(x, 0, 1)");
  });

  it("parses nested calls", () => {
    expect(printOf("max(min(a, b), clamp(c, 0, 100))")).toBe(
      "max(min(a, b), clamp(c, 0, 100))"
    );
  });

  it("allows expressions as call arguments", () => {
    expect(printOf("round(a + b * 2, 1)")).toBe("round((a + (b * 2)), 1)");
  });
});

describe("parse: round-trip (parse -> print -> parse)", () => {
  const sources = [
    "1 + 2 * 3 - 4 / 2",
    "-x ^ 2 + y",
    "clamp(prior_turnover + delta, 0, 100)",
    "(a + b) * (c - d)",
    "a == b",
    "a != b",
    "a <= b",
    "min(a, max(b, c), abs(d))",
  ];

  for (const source of sources) {
    it(`round-trips: ${source}`, () => {
      const first = printOf(source);
      const second = printOf(first);
      expect(second).toBe(first);
    });
  }
});

describe("parse: structured errors", () => {
  it("reports unbalanced (missing close) parens with a position", () => {
    const r = parse("(1 + 2");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.col).toBeGreaterThan(0);
  });

  it("reports an unexpected close paren", () => {
    const r = parse("1 + 2)");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/trailing/i);
  });

  it("reports a dangling operator", () => {
    const r = parse("1 +");
    expect(r.ok).toBe(false);
  });

  it("reports an empty expression", () => {
    const r = parse("");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/end of expression/i);
  });

  it("rejects chained comparisons", () => {
    const r = parse("1 < 2 < 3");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/chained/i);
  });

  it("rejects a missing comma between call args", () => {
    const r = parse("clamp(a b, 0, 1)");
    expect(r.ok).toBe(false);
  });

  it("propagates lexer errors with their column", () => {
    const r = parse("1 & 2");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.col).toBe(3);
  });

  it("never throws — deeply unbalanced parens return a structured error", () => {
    expect(() => parse("(".repeat(5000))).not.toThrow();
    const r = parse("(".repeat(5000));
    expect(r.ok).toBe(false);
  });

  it("rejects an expression with more nodes than MAX_AST_NODES", () => {
    // A long chain of additions: N numbers -> ~2N-1 nodes.
    const chain = Array.from({ length: MAX_AST_NODES + 10 }, () => "1").join("+");
    const r = parse(chain);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/complex/i);
  });

  it("rejects a pathologically deep unary-minus chain", () => {
    const source = "-".repeat(200) + "1";
    const r = parse(source);
    expect(r.ok).toBe(false);
  });
});
