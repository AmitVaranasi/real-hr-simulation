import type { Locale } from "./config";

export type MessageVars = Record<string, string | number>;

/**
 * A small, dependency-free subset of ICU MessageFormat: `{name}`
 * interpolation and a single `{var, plural, ...}` clause per message.
 *
 * We deliberately do NOT use an `n === 1` ternary for plurals — that is
 * wrong for locales whose plural categories don't map onto English (and
 * is the most common way this feature gets botched). Category selection
 * goes through `Intl.PluralRules`, which knows the real CLDR rules for
 * the active locale (en: one/other; es: one/other, but other languages
 * this could later support have few/many/zero/two — the parser already
 * supports every category, only en/es use it today).
 *
 * Supported syntax inside a message string:
 *   "{count, plural, =0 {no items} one {# item} other {# items}}"
 *   "Hello {name}"
 * `#` inside a plural case is replaced with the formatted count.
 * Exact matches (`=0`, `=1`, ...) take priority over plural categories,
 * which is how "no items" (rather than a grammatically valid but odd
 * "0 items") gets expressed for the zero case in English.
 */
export function formatMessage(
  template: string,
  vars: MessageVars | undefined,
  locale: Locale
): string {
  let out = "";
  let i = 0;
  const len = template.length;

  while (i < len) {
    const ch = template[i];
    if (ch === "{") {
      const close = findMatchingBrace(template, i);
      if (close === -1) {
        // Unbalanced braces — emit literally rather than throwing on
        // user-visible content.
        out += template.slice(i);
        break;
      }
      const inner = template.slice(i + 1, close);
      out += resolvePlaceholder(inner, vars, locale);
      i = close + 1;
    } else {
      out += ch;
      i += 1;
    }
  }

  return out;
}

function findMatchingBrace(str: string, openIndex: number): number {
  let depth = 0;
  for (let i = openIndex; i < str.length; i++) {
    if (str[i] === "{") depth += 1;
    else if (str[i] === "}") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function resolvePlaceholder(
  inner: string,
  vars: MessageVars | undefined,
  locale: Locale
): string {
  const commaIndex = inner.indexOf(",");
  if (commaIndex === -1) {
    // Plain interpolation: {name}
    const name = inner.trim();
    const value = vars?.[name];
    return value === undefined ? `{${name}}` : String(value);
  }

  const name = inner.slice(0, commaIndex).trim();
  const rest = inner.slice(commaIndex + 1).trim();
  const secondComma = rest.indexOf(",");
  const type = (secondComma === -1 ? rest : rest.slice(0, secondComma)).trim();

  if (type !== "plural") {
    // Unsupported ICU argument type — fall back to plain interpolation
    // of the variable rather than throwing.
    const value = vars?.[name];
    return value === undefined ? `{${name}}` : String(value);
  }

  const casesStr = secondComma === -1 ? "" : rest.slice(secondComma + 1).trim();
  const cases = parsePluralCases(casesStr);
  const raw = vars?.[name];
  const count = typeof raw === "number" ? raw : Number(raw ?? 0);

  const exact = cases.get(`=${count}`);
  if (exact !== undefined) {
    return substituteHash(exact, count, locale);
  }

  const rules = new Intl.PluralRules(locale);
  const category = rules.select(count);
  const matched = cases.get(category) ?? cases.get("other") ?? "";
  return substituteHash(matched, count, locale);
}

function substituteHash(body: string, count: number, locale: Locale): string {
  const formatted = new Intl.NumberFormat(locale).format(count);
  return body.replace(/#/g, formatted);
}

/** Parses `=0 {a} one {b} other {c}` into a category -> body map. */
function parsePluralCases(str: string): Map<string, string> {
  const cases = new Map<string, string>();
  let i = 0;
  while (i < str.length) {
    while (i < str.length && /\s/.test(str[i])) i += 1;
    if (i >= str.length) break;

    let label = "";
    while (i < str.length && str[i] !== "{" && !/\s/.test(str[i])) {
      label += str[i];
      i += 1;
    }
    while (i < str.length && /\s/.test(str[i])) i += 1;
    if (str[i] !== "{") break;

    const close = findMatchingBrace(str, i);
    if (close === -1) break;
    const body = str.slice(i + 1, close);
    cases.set(label, body);
    i = close + 1;
  }
  return cases;
}
