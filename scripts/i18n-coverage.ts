/**
 * i18n coverage report.
 *
 *   npx tsx scripts/i18n-coverage.ts
 *
 * Two independent checks, both informational (non-zero exit only on the
 * catalog check, since a missing/untranslated key is an actual product
 * bug — a raw key or wrong-language text a student could see):
 *
 * 1. Catalog parity: every key in src/locales/en/<ns>.json must exist in
 *    the matching es/<ns>.json, and vice versa. Also flags any es value
 *    that is byte-for-byte identical to its en value on a namespace we
 *    treat as migrated (i.e. not one of the reserved "_todo" stub
 *    namespaces) — a silent copy-over is worse than an obvious gap,
 *    per the project's translation-quality rule.
 *
 * 2. Remaining hardcoded strings: a conservative grep over components
 *    already migrated (imports useTranslation/getServerTranslator) for
 *    leftover English JSX text nodes, so partial migrations are
 *    measurable instead of a guess. This half is a heuristic, not a
 *    hard gate — it exists to make "what's left in this file" visible,
 *    not to fail CI on it.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..");
const LOCALES_DIR = join(ROOT, "src", "locales");
const LOCALES = ["en", "es"] as const;

// Namespaces that are deliberately empty stubs (see src/locales/*/*.json)
// — reserved for surfaces not migrated yet, own by another branch, etc.
// Parity/duplication checks skip these; they only ever contain a single
// "_todo" key by convention.
const STUB_NAMESPACES = new Set(["instructor", "admin", "decisions"]);

function loadCatalog(locale: string, namespace: string): Record<string, string> {
  const path = join(LOCALES_DIR, locale, `${namespace}.json`);
  return JSON.parse(readFileSync(path, "utf8"));
}

function namespacesFor(locale: string): string[] {
  return readdirSync(join(LOCALES_DIR, locale))
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""))
    .sort();
}

function checkCatalogParity(): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  const [enNamespaces, esNamespaces] = LOCALES.map(namespacesFor);
  for (const ns of enNamespaces) {
    if (!esNamespaces.includes(ns)) {
      errors.push(`Namespace "${ns}" exists in en but not es.`);
    }
  }
  for (const ns of esNamespaces) {
    if (!enNamespaces.includes(ns)) {
      errors.push(`Namespace "${ns}" exists in es but not en.`);
    }
  }

  for (const ns of enNamespaces) {
    if (STUB_NAMESPACES.has(ns)) continue;
    if (!esNamespaces.includes(ns)) continue;

    const en = loadCatalog("en", ns);
    const es = loadCatalog("es", ns);
    const enKeys = Object.keys(en);
    const esKeys = Object.keys(es);

    for (const key of enKeys) {
      if (!(key in es)) {
        errors.push(`Missing es translation: ${ns}.${key}`);
      } else if (
        en[key] === es[key] &&
        /[a-zA-Z]/.test(en[key]) // punctuation-only values (e.g. "—") are fine to match
      ) {
        warnings.push(
          `es.${ns}.${key} is identical to en — looks like an untranslated copy, not a genuine match.`
        );
      }
    }
    for (const key of esKeys) {
      if (!(key in en)) {
        errors.push(`es.${ns}.${key} has no matching en key (orphaned translation).`);
      }
    }
  }

  return { errors, warnings };
}

/** Recursively lists .tsx files under a directory. */
function listTsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listTsxFiles(full));
    } else if (entry.name.endsWith(".tsx") && !entry.name.endsWith(".test.tsx")) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Heuristic: a JSX text node made of letters/spaces/punctuation, at
 * least 3 characters, that isn't already wrapped in a `t(...)` call.
 * This intentionally over-flags (className strings, code comments
 * reformatted as text) — it's a worklist for a human, not a linter.
 */
const JSX_TEXT_RE = />\s*([A-Z][a-zA-Z0-9 ,.'!?:;()#/-]{2,})\s*</g;

function findHardcodedStrings(file: string): string[] {
  const src = readFileSync(file, "utf8");
  const usesTranslation =
    src.includes("useTranslation(") ||
    src.includes("getServerTranslator(") ||
    src.includes("useLocale(");
  if (!usesTranslation) return [];

  const hits: string[] = [];
  let match: RegExpExecArray | null;
  JSX_TEXT_RE.lastIndex = 0;
  while ((match = JSX_TEXT_RE.exec(src))) {
    const text = match[1].trim();
    if (!text || /^\{/.test(text)) continue;
    hits.push(text);
  }
  return hits;
}

function main() {
  const { errors, warnings } = checkCatalogParity();

  console.log("=== i18n catalog parity ===");
  if (errors.length === 0) {
    console.log("OK — every en key has an es translation (and vice versa).");
  } else {
    for (const e of errors) console.log(`ERROR: ${e}`);
  }
  for (const w of warnings) console.log(`WARN: ${w}`);

  console.log("\n=== Hardcoded strings remaining in migrated components ===");
  const srcDir = join(ROOT, "src");
  const files = listTsxFiles(srcDir);
  let totalHits = 0;
  for (const file of files) {
    const hits = findHardcodedStrings(file);
    if (hits.length === 0) continue;
    totalHits += hits.length;
    console.log(`\n${file.replace(ROOT + "/", "")}`);
    for (const h of hits) console.log(`  - "${h}"`);
  }
  if (totalHits === 0) {
    console.log("None found in components that call useTranslation/getServerTranslator.");
  } else {
    console.log(`\n${totalHits} candidate string(s) across migrated components.`);
  }

  if (errors.length > 0) {
    console.log(`\n${errors.length} catalog error(s).`);
    process.exit(1);
  }
}

main();
