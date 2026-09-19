/**
 * Recursive-descent parser: tokens -> AST.
 *
 * Precedence, low to high:
 *   1. comparison   < <= > >= == !=      (non-associative — chaining is a parse error)
 *   2. additive     + -                  (left-assoc)
 *   3. multiplicative * / %              (left-assoc)
 *   4. unary        unary - / unary +    (right-assoc, binds tighter than *)
 *   5. power        ^                    (right-assoc, binds tighter than unary so
 *                                         `-2^2` parses as `-(2^2)`, matching convention)
 *   6. primary      number | ident | call | ( expr )
 *
 * Every failure is returned as a structured { ok:false, error:{message,col} }
 * value — this module never throws.
 */

import { tokenize, type Token } from "./lexer";
import { MAX_AST_NODES, MAX_AST_DEPTH, countNodes, nodeDepth, type AstNode, type BinaryOp } from "./ast";

export interface ParseError {
  message: string;
  col: number;
}

export type ParseResult =
  | { ok: true; ast: AstNode }
  | { ok: false; error: ParseError };

const COMPARISON_OPS = new Set(["LT", "LTE", "GT", "GTE", "EQEQ", "NEQ"]);
const TOKEN_TO_OP: Record<string, BinaryOp> = {
  PLUS: "+",
  MINUS: "-",
  STAR: "*",
  SLASH: "/",
  PERCENT: "%",
  CARET: "^",
  LT: "<",
  LTE: "<=",
  GT: ">",
  GTE: ">=",
  EQEQ: "==",
  NEQ: "!=",
};

class Cursor {
  constructor(private tokens: Token[], private pos = 0) {}
  peek(): Token {
    return this.tokens[this.pos];
  }
  next(): Token {
    const t = this.tokens[this.pos];
    if (this.pos < this.tokens.length - 1) this.pos++;
    return t;
  }
  at(type: Token["type"]): boolean {
    return this.peek().type === type;
  }
}

class ParseFailure extends Error {
  constructor(public col: number, message: string) {
    super(message);
  }
}

function fail(col: number, message: string): never {
  throw new ParseFailure(col, message);
}

function parseExpression(c: Cursor): AstNode {
  return parseComparison(c);
}

function parseComparison(c: Cursor): AstNode {
  const left = parseAdditive(c);
  if (COMPARISON_OPS.has(c.peek().type)) {
    const opTok = c.next();
    const right = parseAdditive(c);
    if (COMPARISON_OPS.has(c.peek().type)) {
      fail(c.peek().col, "Chained comparisons are not supported — use parentheses");
    }
    return {
      type: "Binary",
      op: TOKEN_TO_OP[opTok.type],
      left,
      right,
      col: opTok.col,
    };
  }
  return left;
}

function parseAdditive(c: Cursor): AstNode {
  let left = parseMultiplicative(c);
  while (c.at("PLUS") || c.at("MINUS")) {
    const opTok = c.next();
    const right = parseMultiplicative(c);
    left = { type: "Binary", op: TOKEN_TO_OP[opTok.type], left, right, col: opTok.col };
  }
  return left;
}

function parseMultiplicative(c: Cursor): AstNode {
  let left = parseUnary(c);
  while (c.at("STAR") || c.at("SLASH") || c.at("PERCENT")) {
    const opTok = c.next();
    const right = parseUnary(c);
    left = { type: "Binary", op: TOKEN_TO_OP[opTok.type], left, right, col: opTok.col };
  }
  return left;
}

function parseUnary(c: Cursor): AstNode {
  if (c.at("MINUS") || c.at("PLUS")) {
    const opTok = c.next();
    const argument = parseUnary(c);
    return { type: "Unary", op: opTok.type === "MINUS" ? "-" : "+", argument, col: opTok.col };
  }
  return parsePower(c);
}

function parsePower(c: Cursor): AstNode {
  const left = parsePrimary(c);
  if (c.at("CARET")) {
    const opTok = c.next();
    const right = parseUnary(c); // right-assoc, and lets `2^-1` work
    return { type: "Binary", op: "^", left, right, col: opTok.col };
  }
  return left;
}

function parsePrimary(c: Cursor): AstNode {
  const tok = c.peek();

  if (tok.type === "NUMBER") {
    c.next();
    const value = Number(tok.value);
    if (!Number.isFinite(value)) {
      fail(tok.col, `Number literal out of range: '${tok.value}'`);
    }
    return { type: "Number", value, col: tok.col };
  }

  if (tok.type === "IDENT") {
    c.next();
    if (c.at("LPAREN")) {
      c.next();
      const args: AstNode[] = [];
      if (!c.at("RPAREN")) {
        args.push(parseExpression(c));
        while (c.at("COMMA")) {
          c.next();
          args.push(parseExpression(c));
        }
      }
      if (!c.at("RPAREN")) {
        fail(c.peek().col, "Expected ')' to close function call");
      }
      c.next();
      return { type: "Call", callee: tok.value, args, col: tok.col };
    }
    return { type: "Identifier", name: tok.value, col: tok.col };
  }

  if (tok.type === "LPAREN") {
    c.next();
    const inner = parseExpression(c);
    if (!c.at("RPAREN")) {
      fail(c.peek().col, "Expected ')'");
    }
    c.next();
    return inner;
  }

  if (tok.type === "EOF") {
    fail(tok.col, "Unexpected end of expression");
  }

  fail(tok.col, `Unexpected token '${tok.value}'`);
}

export function parse(source: string): ParseResult {
  const lexed = tokenize(source);
  if (!lexed.ok) {
    return { ok: false, error: lexed.error };
  }

  try {
    const cursor = new Cursor(lexed.tokens);
    const ast = parseExpression(cursor);
    if (!cursor.at("EOF")) {
      const t = cursor.peek();
      return { ok: false, error: { message: `Unexpected trailing token '${t.value}'`, col: t.col } };
    }
    if (countNodes(ast) > MAX_AST_NODES) {
      return {
        ok: false,
        error: { message: `Expression too complex (max ${MAX_AST_NODES} nodes)`, col: 1 },
      };
    }
    if (nodeDepth(ast) > MAX_AST_DEPTH) {
      return {
        ok: false,
        error: { message: `Expression nested too deeply (max depth ${MAX_AST_DEPTH})`, col: 1 },
      };
    }
    return { ok: true, ast };
  } catch (e) {
    if (e instanceof ParseFailure) {
      return { ok: false, error: { message: e.message, col: e.col } };
    }
    // Any unexpected exception (e.g. a stack overflow from pathological
    // nesting) is still surfaced as a structured error, never a throw.
    return { ok: false, error: { message: "Failed to parse expression", col: 1 } };
  }
}
