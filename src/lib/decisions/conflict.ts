/**
 * Pure field-level conflict classification for concurrent decision edits.
 *
 * No Supabase import on purpose: this module is the part of the concurrency
 * fix that most needs to be exhaustively unit-tested, and keeping it free of
 * I/O means the tests exercise real logic instead of a mocked client.
 *
 * Three snapshots are compared per field:
 *   - `base`   — what the client loaded before editing (their starting point)
 *   - `mine`   — the client's current, possibly-edited local value
 *   - `theirs` — the value now on the server (may include a teammate's write)
 *
 * A field is classified by comparing each side against `base`:
 *   - unchanged             base == mine == theirs
 *   - changed-by-me-only    base != mine,  base == theirs
 *   - changed-by-them-only  base == mine,  base != theirs
 *   - changed-by-both       base != mine,  base != theirs (mine != theirs)
 *
 * When both sides changed but landed on the identical value, there is
 * nothing to resolve, so that case is folded into `unchanged` rather than
 * flagged as a conflict — see `classifyField`'s "converged" branch.
 */

export type FieldClassification =
  | "unchanged"
  | "changed-by-me-only"
  | "changed-by-them-only"
  | "changed-by-both";

export type ConflictReport = Record<string, FieldClassification>;

/**
 * Structural equality for the value shapes decisions store: primitives,
 * plain objects (e.g. org_design_json), and arrays of primitives/objects
 * (e.g. positions_to_fill_json). Key order in objects is irrelevant.
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    return a.every((item, i) => deepEqual(item, b[i]));
  }

  if (typeof a === "object" && typeof b === "object") {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((k) => deepEqual(aObj[k], bObj[k]));
  }

  // Primitives that aren't ===-equal (e.g. NaN handled by Object.is below).
  return Object.is(a, b);
}

/**
 * Classify a single field given its value in each of the three snapshots.
 * `hasBase` is false when no baseline snapshot exists at all (e.g. the
 * client never loaded a prior row) — in that case provenance can't be
 * determined per-field, so the field is treated conservatively: identical
 * values are unchanged, differing values are a conflict needing a choice.
 */
export function classifyField(
  base: unknown,
  mine: unknown,
  theirs: unknown,
  hasBase: boolean
): FieldClassification {
  if (!hasBase) {
    return deepEqual(mine, theirs) ? "unchanged" : "changed-by-both";
  }

  const meChanged = !deepEqual(base, mine);
  const themChanged = !deepEqual(base, theirs);

  if (!meChanged && !themChanged) return "unchanged";
  if (meChanged && !themChanged) return "changed-by-me-only";
  if (!meChanged && themChanged) return "changed-by-them-only";

  // Both sides moved away from base. If they converged on the same value
  // there's nothing to resolve.
  return deepEqual(mine, theirs) ? "unchanged" : "changed-by-both";
}

/**
 * Classify every field present across the three snapshots.
 *
 * `base` may be `null` when the client has no prior snapshot (e.g. it was
 * lost, or this is a first-time save racing another first-time save).
 */
export function classifyDecision(
  base: Record<string, unknown> | null,
  mine: Record<string, unknown>,
  theirs: Record<string, unknown>
): ConflictReport {
  const hasBase = base !== null;
  const keys = new Set<string>([
    ...Object.keys(base ?? {}),
    ...Object.keys(mine),
    ...Object.keys(theirs),
  ]);

  const report: ConflictReport = {};
  for (const key of keys) {
    report[key] = classifyField(
      base ? base[key] : undefined,
      mine[key],
      theirs[key],
      hasBase
    );
  }
  return report;
}

/** True when at least one field needs a manual per-field choice. */
export function hasTrueConflicts(report: ConflictReport): boolean {
  return Object.values(report).some((c) => c === "changed-by-both");
}

/** Field names that need a manual per-field choice, in insertion order. */
export function conflictingFields(report: ConflictReport): string[] {
  return Object.entries(report)
    .filter(([, c]) => c === "changed-by-both")
    .map(([k]) => k);
}
