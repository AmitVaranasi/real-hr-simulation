import type { IndustryConfig } from "./types";
import { clamp } from "../utils";

/**
 * HR performance → revenue.
 *
 * A team's preliminary HR performance score (0–100, see `preliminaryHrScore`)
 * raises or lowers revenue, by an amount that depends on the industry. Values
 * come from the SILT-AI Revenue Engine Calibration Proposal v1.0 and are
 * design assumptions to be calibrated, not established causal coefficients.
 */

/** Score bands of the proposal: 0–39, 40–59, 60–74, 75–89, 90–100. */
export const HR_SCORE_BANDS = [
  { min: 0, max: 39 },
  { min: 40, max: 59 },
  { min: 60, max: 74 },
  { min: 75, max: 89 },
  { min: 90, max: 100 },
] as const;

export type HrRevenueMultipliers = [number, number, number, number, number];

/** Used when an industry has no table: HR performance does not move revenue. */
export const NEUTRAL_HR_REVENUE_MULTIPLIERS: HrRevenueMultipliers = [1, 1, 1, 1, 1];

/**
 * "gradual": the band values are reached at each band's midpoint and revenue
 * changes smoothly in between, so one score point never moves revenue by a
 * whole band step. The neutral band (60–74) stays flat at its value.
 * "bands": the fixed step table exactly as written in the proposal.
 */
export type HrRevenueMode = "gradual" | "bands";
export const HR_REVENUE_MODE: HrRevenueMode = "gradual";

export function hrRevenueMultiplier(
  score: number,
  industryConfig: Pick<IndustryConfig, "hr_revenue_multipliers">,
  mode: HrRevenueMode = HR_REVENUE_MODE
): number {
  const table =
    industryConfig.hr_revenue_multipliers ?? NEUTRAL_HR_REVENUE_MULTIPLIERS;
  const s = clamp(Number.isFinite(score) ? score : 0, 0, 100);

  if (mode === "bands") {
    if (s < 40) return table[0];
    if (s < 60) return table[1];
    if (s < 75) return table[2];
    if (s < 90) return table[3];
    return table[4];
  }

  // Anchors: band midpoints, with the whole neutral band held flat.
  const anchors: Array<[number, number]> = [
    [20, table[0]],
    [50, table[1]],
    [60, table[2]],
    [74, table[2]],
    [82, table[3]],
    [95, table[4]],
  ];
  if (s <= anchors[0][0]) return anchors[0][1];
  for (let i = 1; i < anchors.length; i++) {
    const [x1, y1] = anchors[i];
    if (s <= x1) {
      const [x0, y0] = anchors[i - 1];
      return y0 + ((s - x0) / (x1 - x0)) * (y1 - y0);
    }
  }
  return anchors[anchors.length - 1][1];
}
