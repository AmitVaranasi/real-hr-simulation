/**
 * Lexer for the instructor formula-expression language.
 *
 * Deliberately small: numbers, identifiers, `+ - * / % ^`, comparisons
 * (`< <= > >= == !=`), parentheses, and commas. No strings, no scientific
 * notation, no bitwise/logical operators — every token type here is one the
 * parser/evaluator below is proven to handle safely. Every token carries a
 * 1-based column so downstream errors can point at the exact character.
 */

export type TokenType =
  | "NUMBER"
  | "IDENT"
  | "PLUS"
  | "MINUS"
  | "STAR"
  | "SLASH"
  | "PERCENT"
  | "CARET"
  | "LT"
  | "LTE"
  | "GT"
  | "GTE"
  | "EQEQ"
  | "NEQ"
  | "LPAREN"
  | "RPAREN"
  | "COMMA"
  | "EOF";

export interface Token {
  type: TokenType;
  value: string;
  /** 1-based column of the first character of this token. */
  col: number;
}

export interface LexError {
  message: string;
  col: number;
}

export type LexResult =
  | { ok: true; tokens: Token[] }
  | { ok: false; error: LexError };

const SINGLE_CHAR: Record<string, TokenType> = {
  "+": "PLUS",
  "-": "MINUS",
  "*": "STAR",
  "/": "SLASH",
  "%": "PERCENT",
  "^": "CARET",
  "(": "LPAREN",
  ")": "RPAREN",
  ",": "COMMA",
};

/** Hard ceiling on input length — refuses to even attempt to lex a hostile giant string. */
export const MAX_EXPRESSION_LENGTH = 2000;

function isDigit(ch: string): boolean {
  return ch >= "0" && ch <= "9";
}

function isIdentStart(ch: string): boolean {
  return (
    (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch === "_"
  );
}

function isIdentPart(ch: string): boolean {
  return isIdentStart(ch) || isDigit(ch);
}

export function tokenize(source: string): LexResult {
  if (typeof source !== "string") {
    return { ok: false, error: { message: "Expression must be a string", col: 1 } };
  }
  if (source.length > MAX_EXPRESSION_LENGTH) {
    return {
      ok: false,
      error: {
        message: `Expression too long (max ${MAX_EXPRESSION_LENGTH} characters)`,
        col: MAX_EXPRESSION_LENGTH + 1,
      },
    };
  }

  const tokens: Token[] = [];
  let i = 0;
  const n = source.length;

  while (i < n) {
    const ch = source[i];
    const col = i + 1;

    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
      i++;
      continue;
    }

    if (ch === "<") {
      if (source[i + 1] === "=") {
        tokens.push({ type: "LTE", value: "<=", col });
        i += 2;
      } else {
        tokens.push({ type: "LT", value: "<", col });
        i += 1;
      }
      continue;
    }
    if (ch === ">") {
      if (source[i + 1] === "=") {
        tokens.push({ type: "GTE", value: ">=", col });
        i += 2;
      } else {
        tokens.push({ type: "GT", value: ">", col });
        i += 1;
      }
      continue;
    }
    if (ch === "=") {
      if (source[i + 1] === "=") {
        tokens.push({ type: "EQEQ", value: "==", col });
        i += 2;
      } else {
        return { ok: false, error: { message: "Unexpected '='. Did you mean '=='?", col } };
      }
      continue;
    }
    if (ch === "!") {
      if (source[i + 1] === "=") {
        tokens.push({ type: "NEQ", value: "!=", col });
        i += 2;
      } else {
        return { ok: false, error: { message: "Unexpected '!'. Did you mean '!='?", col } };
      }
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(SINGLE_CHAR, ch)) {
      tokens.push({ type: SINGLE_CHAR[ch], value: ch, col });
      i += 1;
      continue;
    }

    if (isDigit(ch) || (ch === "." && isDigit(source[i + 1] ?? ""))) {
      let j = i;
      let sawDot = false;
      while (j < n && (isDigit(source[j]) || (source[j] === "." && !sawDot))) {
        if (source[j] === ".") sawDot = true;
        j++;
      }
      // Reject a trailing dot with no following digit, e.g. "12."
      const text = source.slice(i, j);
      if (text.endsWith(".")) {
        return {
          ok: false,
          error: { message: `Malformed number '${text}'`, col },
        };
      }
      if (text.length > 64) {
        return {
          ok: false,
          error: { message: "Number literal too long", col },
        };
      }
      tokens.push({ type: "NUMBER", value: text, col });
      i = j;
      continue;
    }

    if (isIdentStart(ch)) {
      let j = i + 1;
      while (j < n && isIdentPart(source[j])) j++;
      const text = source.slice(i, j);
      if (text.length > 128) {
        return { ok: false, error: { message: "Identifier too long", col } };
      }
      tokens.push({ type: "IDENT", value: text, col });
      i = j;
      continue;
    }

    return {
      ok: false,
      error: { message: `Unexpected character '${ch}'`, col },
    };
  }

  tokens.push({ type: "EOF", value: "", col: n + 1 });
  return { ok: true, tokens };
}
