export * from "./ast";
export * from "./lexer";
export * from "./parser";
export * from "./validator";
export * from "./evaluator";
export * from "./printer";

import { parse } from "./parser";
import { validate, type ValidationIssue } from "./validator";
import { evaluate, type EvalResult, type VariableMap } from "./evaluator";
import type { AstNode } from "./ast";

export interface CompileResult {
  ok: boolean;
  ast: AstNode | null;
  errors: Array<{ message: string; col: number }>;
}

/**
 * Convenience pipeline for callers that just want "is this a legal formula
 * against this variable whitelist" without orchestrating each stage.
 */
export function compile(source: string, variables: readonly string[]): CompileResult {
  const parsed = parse(source);
  if (!parsed.ok) {
    return { ok: false, ast: null, errors: [parsed.error] };
  }
  const issues: ValidationIssue[] = validate(parsed.ast, { variables });
  if (issues.length > 0) {
    return { ok: false, ast: parsed.ast, errors: issues };
  }
  return { ok: true, ast: parsed.ast, errors: [] };
}

/** Compile and evaluate in one call, folding every failure into EvalResult. */
export function run(
  source: string,
  variables: readonly string[],
  values: VariableMap
): EvalResult {
  const compiled = compile(source, variables);
  if (!compiled.ok || !compiled.ast) {
    return { ok: false, error: compiled.errors.map((e) => e.message).join("; ") };
  }
  return evaluate(compiled.ast, values);
}
