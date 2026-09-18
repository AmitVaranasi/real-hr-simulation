import { describe, expect, it } from "vitest";
import { FORMULA_CATALOG, formulaById } from "../formula-catalog";

// FORMULA_CATALOG itself is a static, hand-written documentation array (human
// readable formula strings for admins) — asserting its literal contents back
// to itself would just restate the file, so it is skipped per the "skip pure
// constant re-exports" rule. formulaById() is the one piece of real logic:
// a lookup with a defined miss case.
describe("formulaById", () => {
  it("finds a known entry by id and returns the matching catalog object", () => {
    const entry = formulaById("training-roi");
    expect(entry).not.toBeNull();
    expect(entry?.id).toBe("training-roi");
    expect(entry).toBe(
      FORMULA_CATALOG.find((f) => f.id === "training-roi")
    );
  });

  it("returns null (not undefined) for an id that does not exist", () => {
    // formulaById uses `?? null`, so a miss must be exactly `null`, not
    // `undefined` — callers may rely on the strict null for e.g. JSON
    // serialization or React conditional rendering.
    const result = formulaById("does-not-exist");
    expect(result).toBeNull();
  });

  it("is case-sensitive and does not fuzzy-match ids", () => {
    expect(formulaById("Training-ROI")).toBeNull();
    expect(formulaById("training")).toBeNull();
  });

  it("every catalog id is unique", () => {
    // Not a hardcoded-constant assertion — this checks a structural
    // invariant (no duplicate ids) that formulaById's `.find()` silently
    // depends on: a duplicate id would make the second entry unreachable.
    const ids = FORMULA_CATALOG.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
