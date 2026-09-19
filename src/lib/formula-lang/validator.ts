/**
 * Static validation over a parsed AST: unknown-identifier checks against a
 * caller-supplied whitelist, function arity, and literal division-by-zero.
 * Parenthesis balance and precedence are already enforced by the parser, so
 * a syntactically valid AST reaching here only needs semantic checks.
 */

import { FUNCTION_ARITY, FUNCTION_NAMES, type AstNode, type FunctionName } from "./ast";

export interface ValidationIssue {
  message: string;
  col: number;
}

export interface ValidateOptions {
  /** Whitelist of identifiers the formula is allowed to reference. */
  variables: readonly string[];
}

/** Levenshtein distance, used only to suggest a likely-intended variable name. */
function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0)
  );
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

function closestVariable(name: string, variables: readonly string[]): string | null {
  let best: string | null = null;
  let bestDist = Infinity;
  for (const v of variables) {
    const dist = levenshtein(name.toLowerCase(), v.toLowerCase());
    if (dist < bestDist) {
      bestDist = dist;
      best = v;
    }
  }
  // Only suggest when it's plausibly a typo, not a wildly different word.
  if (best !== null && bestDist <= Math.max(3, Math.ceil(best.length / 2))) {
    return best;
  }
  return null;
}

function isFunctionName(name: string): name is FunctionName {
  return (FUNCTION_NAMES as readonly string[]).includes(name);
}

function walk(node: AstNode, variables: readonly string[], issues: ValidationIssue[]): void {
  switch (node.type) {
    case "Number":
      return;
    case "Identifier": {
      if (!variables.includes(node.name)) {
        const suggestion = closestVariable(node.name, variables);
        issues.push({
          message: suggestion
            ? `Unknown variable '${node.name}'. Did you mean '${suggestion}'?`
            : `Unknown variable '${node.name}'`,
          col: node.col,
        });
      }
      return;
    }
    case "Unary":
      walk(node.argument, variables, issues);
      return;
    case "Binary": {
      walk(node.left, variables, issues);
      walk(node.right, variables, issues);
      if (
        node.op === "/" &&
        node.right.type === "Number" &&
        node.right.value === 0
      ) {
        issues.push({ message: "Division by literal zero", col: node.col });
      }
      if (
        node.op === "%" &&
        node.right.type === "Number" &&
        node.right.value === 0
      ) {
        issues.push({ message: "Modulo by literal zero", col: node.col });
      }
      return;
    }
    case "Call": {
      if (!isFunctionName(node.callee)) {
        const suggestion = closestVariable(node.callee, FUNCTION_NAMES);
        issues.push({
          message: suggestion
            ? `Unknown function '${node.callee}'. Did you mean '${suggestion}'?`
            : `Unknown function '${node.callee}'. Available: ${FUNCTION_NAMES.join(", ")}`,
          col: node.col,
        });
      } else {
        const arity = FUNCTION_ARITY[node.callee];
        if (node.args.length < arity.min || node.args.length > arity.max) {
          const expected =
            arity.min === arity.max
              ? `exactly ${arity.min}`
              : `between ${arity.min} and ${arity.max}`;
          issues.push({
            message: `'${node.callee}' expects ${expected} argument(s), got ${node.args.length}`,
            col: node.col,
          });
        }
      }
      for (const arg of node.args) walk(arg, variables, issues);
      return;
    }
  }
}

export function validate(ast: AstNode, options: ValidateOptions): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  walk(ast, options.variables, issues);
  return issues;
}
