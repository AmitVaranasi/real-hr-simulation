/**
 * AST -> source text, fully parenthesized. Not used at runtime — it exists
 * so parse -> print -> parse round-trip tests can prove the parser is
 * structurally consistent (see parser.test.ts).
 */

import type { AstNode } from "./ast";

export function print(node: AstNode): string {
  switch (node.type) {
    case "Number":
      return String(node.value);
    case "Identifier":
      return node.name;
    case "Unary":
      return `(${node.op}${print(node.argument)})`;
    case "Binary":
      return `(${print(node.left)} ${node.op} ${print(node.right)})`;
    case "Call":
      return `${node.callee}(${node.args.map(print).join(", ")})`;
  }
}
