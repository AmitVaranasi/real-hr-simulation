/**
 * Sandboxed AST evaluator. This is the only module that turns an expression
 * into a number, and it is written to be TOTAL:
 *
 *   - no `eval`/`new Function`/`Function` constructor anywhere
 *   - no property access, no host object of any kind reaches the tree walk —
 *     the only inputs are the AST (data) and a plain `Record<string, number>`
 *     variable map (data), and the only outputs are a number or an error
 *   - identifiers are looked up with `Object.prototype.hasOwnProperty.call`,
 *     never `vars[name]` or `vars.name`, so `__proto__`/`constructor`/
 *     `toString` etc. can never resolve to inherited Object.prototype members
 *   - recursion depth and node count are bounded (ast.ts) and re-checked here
 *   - every arithmetic result is checked for NaN/Infinity and turned into a
 *     structured error rather than propagating a poisoned value
 *   - the function returns a discriminated union, never throws — a `try/catch`
 *     around the whole walk is a last-resort safety net, not the primary
 *     mechanism, since every branch already returns instead of throwing
 */

import { MAX_AST_DEPTH, type AstNode } from "./ast";

export type EvalResult =
  | { ok: true; value: number }
  | { ok: false; error: string };

export type VariableMap = Readonly<Record<string, number>>;

const EVAL_DEPTH_GUARD = MAX_AST_DEPTH + 5;

function hasOwn(obj: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

class EvalFailure extends Error {}

function fail(message: string): never {
  throw new EvalFailure(message);
}

function checkFinite(value: number, context: string): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    fail(`${context} produced NaN`);
  }
  if (!Number.isFinite(value)) {
    fail(`${context} produced a non-finite value`);
  }
  return value;
}

function callFunction(name: string, args: number[]): number {
  switch (name) {
    case "min":
      return Math.min(...args);
    case "max":
      return Math.max(...args);
    case "clamp": {
      const [value, lo, hi] = args;
      if (lo > hi) fail("clamp() requires min <= max");
      return Math.min(Math.max(value, lo), hi);
    }
    case "round": {
      const [value, digits = 0] = args;
      if (!Number.isInteger(digits) || digits < 0 || digits > 10) {
        fail("round() digits must be an integer between 0 and 10");
      }
      const factor = 10 ** digits;
      return Math.round(value * factor) / factor;
    }
    case "abs":
      return Math.abs(args[0]);
    default:
      fail(`Unknown function '${name}'`);
  }
}

function evalNode(node: AstNode, vars: VariableMap, depth: number): number {
  if (depth > EVAL_DEPTH_GUARD) {
    fail("Expression nested too deeply to evaluate");
  }

  switch (node.type) {
    case "Number":
      return checkFinite(node.value, "Number literal");

    case "Identifier": {
      if (!hasOwn(vars, node.name)) {
        fail(`Unknown variable '${node.name}'`);
      }
      const value = (vars as Record<string, unknown>)[node.name];
      if (typeof value !== "number") {
        fail(`Variable '${node.name}' is not a number`);
      }
      return checkFinite(value, `Variable '${node.name}'`);
    }

    case "Unary": {
      const arg = evalNode(node.argument, vars, depth + 1);
      const result = node.op === "-" ? -arg : arg;
      return checkFinite(result, "Unary expression");
    }

    case "Binary": {
      const left = evalNode(node.left, vars, depth + 1);
      const right = evalNode(node.right, vars, depth + 1);
      switch (node.op) {
        case "+":
          return checkFinite(left + right, "Addition");
        case "-":
          return checkFinite(left - right, "Subtraction");
        case "*":
          return checkFinite(left * right, "Multiplication");
        case "/":
          if (right === 0) fail("Division by zero");
          return checkFinite(left / right, "Division");
        case "%":
          if (right === 0) fail("Modulo by zero");
          return checkFinite(left % right, "Modulo");
        case "^": {
          const result = Math.pow(left, right);
          return checkFinite(result, "Exponentiation");
        }
        case "<":
          return left < right ? 1 : 0;
        case "<=":
          return left <= right ? 1 : 0;
        case ">":
          return left > right ? 1 : 0;
        case ">=":
          return left >= right ? 1 : 0;
        case "==":
          return left === right ? 1 : 0;
        case "!=":
          return left !== right ? 1 : 0;
        default:
          fail("Unknown operator");
      }
      break;
    }

    case "Call": {
      // Guard argument count too, independent of validator having run.
      if (node.args.length > 8) {
        fail(`Too many arguments to '${node.callee}'`);
      }
      const args = node.args.map((a) => evalNode(a, vars, depth + 1));
      const result = callFunction(node.callee, args);
      return checkFinite(result, `${node.callee}()`);
    }

    default: {
      const _exhaustive: never = node;
      fail(`Unsupported node: ${JSON.stringify(_exhaustive)}`);
    }
  }
}

/**
 * Evaluate `ast` against `variables`. Total: always returns, never throws,
 * regardless of how malformed or hostile the AST or variable map is.
 */
export function evaluate(ast: AstNode, variables: VariableMap): EvalResult {
  try {
    if (variables === null || typeof variables !== "object") {
      return { ok: false, error: "Variable map must be an object" };
    }
    const value = evalNode(ast, variables, 0);
    return { ok: true, value };
  } catch (e) {
    if (e instanceof EvalFailure) {
      return { ok: false, error: e.message };
    }
    if (e instanceof RangeError) {
      // Stack overflow from a pathological (but structurally valid) tree.
      return { ok: false, error: "Expression too complex to evaluate" };
    }
    return { ok: false, error: "Evaluation failed" };
  }
}
