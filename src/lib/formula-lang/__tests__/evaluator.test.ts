import { describe, expect, it } from "vitest";
import { parse } from "../parser";
import { evaluate } from "../evaluator";
import type { AstNode } from "../ast";

function evalOf(source: string, vars: Record<string, number> = {}) {
  const parsed = parse(source);
  if (!parsed.ok) throw new Error(`expected parse ok: ${parsed.error.message}`);
  return evaluate(parsed.ast, vars);
}

function value(source: string, vars: Record<string, number> = {}): number {
  const r = evalOf(source, vars);
  if (!r.ok) throw new Error(`expected eval ok, got error: ${r.error}`);
  return r.value;
}

describe("evaluate: arithmetic", () => {
  it("evaluates basic arithmetic with correct precedence", () => {
    expect(value("1 + 2 * 3")).toBe(7);
    expect(value("(1 + 2) * 3")).toBe(9);
    expect(value("2 ^ 3 ^ 2")).toBe(512); // right-assoc: 2^(3^2) = 2^9
    expect(value("10 % 3")).toBe(1);
  });

  it("evaluates unary minus/plus", () => {
    expect(value("-5")).toBe(-5);
    expect(value("--5")).toBe(5);
    expect(value("+5")).toBe(5);
    expect(value("-2 ^ 2")).toBe(-4);
  });

  it("resolves identifiers from the variable map", () => {
    expect(value("turnover + 1", { turnover: 10 })).toBe(11);
  });

  it("evaluates comparisons to 1/0", () => {
    expect(value("1 < 2")).toBe(1);
    expect(value("2 < 1")).toBe(0);
    expect(value("1 == 1")).toBe(1);
    expect(value("1 != 1")).toBe(0);
    expect(value("2 >= 2")).toBe(1);
  });
});

describe("evaluate: functions", () => {
  it("min/max/abs/round/clamp behave as expected", () => {
    expect(value("min(3, 1, 2)")).toBe(1);
    expect(value("max(3, 1, 2)")).toBe(3);
    expect(value("abs(-5)")).toBe(5);
    expect(value("round(3.456, 1)")).toBe(3.5);
    expect(value("round(3.456)")).toBe(3);
    expect(value("clamp(150, 0, 100)")).toBe(100);
    expect(value("clamp(-5, 0, 100)")).toBe(0);
    expect(value("clamp(50, 0, 100)")).toBe(50);
  });

  it("evaluates nested function calls", () => {
    expect(value("max(min(10, 5), 2)")).toBe(5);
  });
});

describe("evaluate: error handling (total, never throws)", () => {
  it("errors on unknown variable rather than returning undefined/NaN", () => {
    const r = evalOf("bogus + 1");
    expect(r.ok).toBe(false);
  });

  it("errors on division by zero (runtime, not just literal)", () => {
    const r = evalOf("a / b", { a: 1, b: 0 });
    expect(r.ok).toBe(false);
  });

  it("errors on modulo by zero", () => {
    const r = evalOf("a % b", { a: 1, b: 0 });
    expect(r.ok).toBe(false);
  });

  it("errors when clamp's min exceeds max", () => {
    const r = evalOf("clamp(a, 100, 0)", { a: 5 });
    expect(r.ok).toBe(false);
  });

  it("errors on a variable value that is not a finite number", () => {
    expect(evalOf("a", { a: NaN }).ok).toBe(false);
    expect(evalOf("a", { a: Infinity }).ok).toBe(false);
    // @ts-expect-error hostile: non-number in the variable map
    expect(evalOf("a", { a: "not a number" }).ok).toBe(false);
    // @ts-expect-error hostile: non-number in the variable map
    expect(evalOf("a", { a: null }).ok).toBe(false);
  });

  it("errors when the result overflows to Infinity", () => {
    const r = evalOf("a ^ b", { a: 10, b: 1000 });
    expect(r.ok).toBe(false);
  });

  it("errors on a bogus operator/node type without throwing", () => {
    const hostile = {
      type: "Binary",
      op: "@@@",
      left: { type: "Number", value: 1, col: 1 },
      right: { type: "Number", value: 2, col: 1 },
      col: 1,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any as AstNode;
    expect(() => evaluate(hostile, {})).not.toThrow();
    expect(evaluate(hostile, {}).ok).toBe(false);
  });

  it("never throws when variables is not a plain object", () => {
    // @ts-expect-error hostile input
    expect(() => evaluate({ type: "Number", value: 1, col: 1 }, null)).not.toThrow();
    // @ts-expect-error hostile input
    const r = evaluate({ type: "Number", value: 1, col: 1 }, null);
    expect(r.ok).toBe(false);
  });
});

describe("evaluate: sandbox — cannot reach Object.prototype / host state", () => {
  it("does not resolve __proto__ to Object.prototype from an empty variable map", () => {
    const r = evalOf("__proto__", {});
    expect(r.ok).toBe(false);
  });

  it("does not resolve constructor/toString/valueOf/hasOwnProperty as identifiers", () => {
    for (const name of ["constructor", "toString", "valueOf", "hasOwnProperty"]) {
      const r = evalOf(name, {});
      expect(r.ok).toBe(false);
    }
  });

  it("an attacker-controlled variable map with a poisoned prototype still only yields declared own properties", () => {
    const poisoned = Object.create({ secret: 999 }) as Record<string, number>;
    poisoned.turnover = 5;
    // 'secret' lives on the prototype, not as an own property — must be rejected.
    const r = evalOf("secret", poisoned);
    expect(r.ok).toBe(false);
    expect(value("turnover", poisoned)).toBe(5);
  });

  it("a formula cannot access Math, globalThis, process, or any host object", () => {
    for (const name of ["Math", "globalThis", "process", "require", "window"]) {
      // Property access ('.') is not part of the grammar at all, so this is
      // rejected at parse time — there is no dot operator to abuse.
      const parsed = parse(`${name}.random`);
      expect(parsed.ok).toBe(false);
      // The bare identifier alone is also just an ordinary unknown variable.
      const r = evalOf(name, {});
      expect(r.ok).toBe(false);
    }
  });

  it("has no way to express a string, so no template/eval-string vector exists", () => {
    const r = parse('"hello"');
    expect(r.ok).toBe(false);
  });
});

describe("evaluate: recursion/complexity guards", () => {
  it("does not hang or crash on a deeply nested legal expression", () => {
    const nested = "(".repeat(55) + "1" + ")".repeat(55);
    const parsed = parse(nested);
    // Parser's own MAX_AST_DEPTH check likely rejects this before eval ever runs.
    if (parsed.ok) {
      expect(() => evaluate(parsed.ast, {})).not.toThrow();
    } else {
      expect(parsed.error).toBeDefined();
    }
  });

  it("a hand-built AST deeper than the eval guard errors instead of overflowing the stack", () => {
    let node: AstNode = { type: "Number", value: 1, col: 1 };
    for (let i = 0; i < 5000; i++) {
      node = { type: "Unary", op: "-", argument: node, col: 1 };
    }
    expect(() => evaluate(node, {})).not.toThrow();
    expect(evaluate(node, {}).ok).toBe(false);
  });

  it("a hand-built AST with a huge argument list to min() does not throw", () => {
    const args: AstNode[] = Array.from({ length: 10000 }, () => ({
      type: "Number",
      value: 1,
      col: 1,
    }));
    const node: AstNode = { type: "Call", callee: "min", args, col: 1 };
    expect(() => evaluate(node, {})).not.toThrow();
    expect(evaluate(node, {}).ok).toBe(false);
  });
});
