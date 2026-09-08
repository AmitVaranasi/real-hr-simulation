/**
 * Industry benchmarks — the reference point the Industry Scoring page compares
 * a class against.
 *
 * Iteration 5 §3 ("Industry Benchmarks Should Be System-Generated") sets three
 * constraints that shape this module:
 *
 *   1. "Do not hard-code benchmark values into report pages." Report pages call
 *      `resolveIndustryBenchmark()`; they never carry numbers of their own.
 *   2. "For early versions of the simulation, Amit may need to use predefined
 *      benchmark values. However, the architecture should anticipate a future
 *      system-wide benchmark generated from simulation performance data."
 *      Hence the `source` discriminator: today `fixed`, later `system`.
 *   3. "The professor should not have to calculate or manage this benchmark
 *      manually." So there is deliberately no professor-facing editor — values
 *      arrive from the designers or, later, from the system.
 *
 * Scale: every value is a PERCENT OF ATTAINABLE (0-100) for that perspective,
 * matching the doc's own example ("High-Tech ... Employee Perspective: 74").
 * Percent is the only strategy-independent scale: a perspective's raw maximum
 * is the team's strategy weight, which differs from 20 to 35 across strategies.
 * `toDisplayScale()` converts back to whatever raw scale a page is showing.
 */
import type { Industry, Strategy } from "./types";
import { STRATEGY_CONFIGS } from "./config";

export type BenchmarkPerspective =
  | "overall"
  | "financial"
  | "employee"
  | "process"
  | "learning";

/** Percent of attainable (0-100) per perspective. A missing key is unknown. */
export type IndustryBenchmark = Partial<
  Record<BenchmarkPerspective, number>
>;

export type ResolvedIndustryBenchmark = {
  industry: Industry | string;
  /** Where the numbers came from — surfaced to the professor, never guessed. */
  source: "system" | "fixed" | "none";
  values: IndustryBenchmark;
};

/**
 * Designer-supplied values, industry -> perspective -> percent of attainable.
 * EMPTY until the simulation designers provide them. The doc's High-Tech
 * figures are labelled "For example" and are illustrative, not a data source,
 * so nothing is seeded here: an unset benchmark renders blank rather than
 * showing a number no one authored.
 */
export const FIXED_INDUSTRY_BENCHMARKS: Partial<
  Record<Industry, IndustryBenchmark>
> = {};

let systemBenchmarks: Partial<Record<Industry, IndustryBenchmark>> = {};

/**
 * Seam for the future dynamic benchmark: once enough anonymized simulation
 * data exists, the system computes per-industry distributions and installs
 * them here, and every report page follows without changing.
 */
export function setSystemIndustryBenchmarks(
  table: Partial<Record<Industry, IndustryBenchmark>> | null
): void {
  systemBenchmarks = table ?? {};
}

export function resolveIndustryBenchmark(
  industry: Industry | string | null | undefined
): ResolvedIndustryBenchmark {
  const key = (industry ?? "") as Industry;
  const system = systemBenchmarks[key];
  if (system && Object.keys(system).length > 0) {
    return { industry: key, source: "system", values: system };
  }
  const fixed = FIXED_INDUSTRY_BENCHMARKS[key];
  if (fixed && Object.keys(fixed).length > 0) {
    return { industry: key, source: "fixed", values: fixed };
  }
  return { industry: key, source: "none", values: {} };
}

/** True when at least one industry has usable benchmark values. */
export function hasAnyIndustryBenchmark(): boolean {
  const tables = [systemBenchmarks, FIXED_INDUSTRY_BENCHMARKS];
  return tables.some((t) =>
    Object.values(t).some((v) => v && Object.keys(v).length > 0)
  );
}

/**
 * The raw maximum of a perspective for a given strategy — a perspective score
 * is capped at its Balanced Scorecard weight (scoring.ts), and Overall is
 * always out of 100.
 */
export function attainableFor(
  perspective: BenchmarkPerspective,
  strategy: Strategy | string | null | undefined
): number | null {
  if (perspective === "overall") return 100;
  const cfg = STRATEGY_CONFIGS[strategy as Strategy];
  if (!cfg) return null;
  return cfg.bsc_weights[perspective];
}

/** Convert a stored percent into the raw scale a page is displaying. */
export function toDisplayScale(
  percent: number | null | undefined,
  attainable: number | null | undefined
): number | null {
  if (percent == null || attainable == null) return null;
  return (percent / 100) * attainable;
}

/** Convert a raw perspective score into percent of attainable. */
export function toPercent(
  raw: number | null | undefined,
  attainable: number | null | undefined
): number | null {
  if (raw == null || attainable == null || attainable === 0) return null;
  return (raw / attainable) * 100;
}
