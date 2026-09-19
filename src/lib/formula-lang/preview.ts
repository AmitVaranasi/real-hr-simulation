/**
 * Preview: evaluate an edited formula against real historical rows and show
 * it side by side with the engine's own recorded value for that row. This
 * is what makes the editor safe to use — an instructor can see the effect
 * of a change on actual past outcomes before it goes live for anyone.
 *
 * Deliberately does not attempt to re-run the real TypeScript engine (which
 * is far larger than this language) to produce the "current" value — it
 * shows the value the engine already computed and stored for that round, so
 * the comparison is grounded in what actually happened, not a
 * reimplementation that could silently drift from the real engine.
 */

import { compile } from "./index";
import { evaluate } from "./evaluator";
import type { AstNode } from "./ast";

export interface PreviewRow {
  /** Human-readable label for this row, e.g. "Team Alpha — Round 3". */
  label: string;
  /** Variable values available to the expression for this row. */
  variables: Readonly<Record<string, number | null>>;
  /** The engine's own recorded value for this formula on this row, if known. */
  currentValue: number | null;
}

export interface PreviewResultRow {
  label: string;
  currentValue: number | null;
  editedValue: number | null;
  editedError: string | null;
  delta: number | null;
}

export interface PreviewResult {
  ok: boolean;
  errors: Array<{ message: string; col: number }>;
  rows: PreviewResultRow[];
}

function evalRow(ast: AstNode, row: PreviewRow): PreviewResultRow {
  const missing = Object.entries(row.variables).filter(([, v]) => v == null);
  if (missing.length > 0) {
    return {
      label: row.label,
      currentValue: row.currentValue,
      editedValue: null,
      editedError: `Missing value for ${missing.map(([k]) => k).join(", ")}`,
      delta: null,
    };
  }

  const values: Record<string, number> = {};
  for (const [k, v] of Object.entries(row.variables)) {
    values[k] = v as number;
  }

  const result = evaluate(ast, values);
  if (!result.ok) {
    return {
      label: row.label,
      currentValue: row.currentValue,
      editedValue: null,
      editedError: result.error,
      delta: null,
    };
  }

  return {
    label: row.label,
    currentValue: row.currentValue,
    editedValue: result.value,
    editedError: null,
    delta: row.currentValue == null ? null : result.value - row.currentValue,
  };
}

/**
 * Compile `source` against `variables`, then evaluate it row by row against
 * `rows` (already-fetched historical data — this function does no I/O).
 * A compile failure short-circuits with no per-row evaluation attempted.
 */
export function buildPreview(
  source: string,
  variables: readonly string[],
  rows: readonly PreviewRow[]
): PreviewResult {
  const compiled = compile(source, variables);
  if (!compiled.ok || !compiled.ast) {
    return { ok: false, errors: compiled.errors, rows: [] };
  }
  const ast = compiled.ast;
  return {
    ok: true,
    errors: [],
    rows: rows.map((row) => evalRow(ast, row)),
  };
}
