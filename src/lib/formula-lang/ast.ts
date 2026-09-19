/**
 * AST node union for the formula language. Every node carries the 1-based
 * source column it started at so validation/evaluation errors can point back
 * at the instructor's text.
 */

export type BinaryOp =
  | "+"
  | "-"
  | "*"
  | "/"
  | "%"
  | "^"
  | "<"
  | "<="
  | ">"
  | ">="
  | "=="
  | "!=";

export const FUNCTION_NAMES = ["min", "max", "clamp", "round", "abs"] as const;
export type FunctionName = (typeof FUNCTION_NAMES)[number];

export const FUNCTION_ARITY: Record<FunctionName, { min: number; max: number }> = {
  min: { min: 1, max: 8 },
  max: { min: 1, max: 8 },
  clamp: { min: 3, max: 3 },
  round: { min: 1, max: 2 },
  abs: { min: 1, max: 1 },
};

export interface NumberNode {
  type: "Number";
  value: number;
  col: number;
}

export interface IdentifierNode {
  type: "Identifier";
  name: string;
  col: number;
}

export interface UnaryNode {
  type: "Unary";
  op: "-" | "+";
  argument: AstNode;
  col: number;
}

export interface BinaryNode {
  type: "Binary";
  op: BinaryOp;
  left: AstNode;
  right: AstNode;
  col: number;
}

export interface CallNode {
  type: "Call";
  callee: string;
  args: AstNode[];
  col: number;
}

export type AstNode = NumberNode | IdentifierNode | UnaryNode | BinaryNode | CallNode;

/** Upper bound on total node count — guards against pathological input the parser
 * would otherwise happily build (e.g. thousands of chained operators). */
export const MAX_AST_NODES = 500;

export function countNodes(node: AstNode): number {
  switch (node.type) {
    case "Number":
    case "Identifier":
      return 1;
    case "Unary":
      return 1 + countNodes(node.argument);
    case "Binary":
      return 1 + countNodes(node.left) + countNodes(node.right);
    case "Call":
      return 1 + node.args.reduce((sum, a) => sum + countNodes(a), 0);
  }
}

/** Maximum tree depth the evaluator will walk without erroring out. */
export const MAX_AST_DEPTH = 60;

export function nodeDepth(node: AstNode): number {
  switch (node.type) {
    case "Number":
    case "Identifier":
      return 1;
    case "Unary":
      return 1 + nodeDepth(node.argument);
    case "Binary":
      return 1 + Math.max(nodeDepth(node.left), nodeDepth(node.right));
    case "Call":
      return 1 + (node.args.length === 0 ? 0 : Math.max(...node.args.map(nodeDepth)));
  }
}
