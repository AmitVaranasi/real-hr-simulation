/**
 * Version of the scoring rules. Every stored result records the version that
 * produced it (`trace_json.engine_version`), so a change in the rules applies
 * to rounds scored from then on and never rewrites a result already stored.
 *
 * 1 — original rules (results stored without a version).
 * 2 — payroll deducted once from profit; revenue driven by the preliminary HR
 *     performance score through the industry multiplier.
 * 3 — all strategies weight the four BSC perspectives 25/25/25/25 (the +3
 *     strategy bonus stays); Employee metrics weighted 25% each; DEI Score
 *     no longer multiplied by 4 and now driven by the DEI Initiatives
 *     decisions; Learning & Growth uses a separate DEI Capability measure;
 *     DEI benchmarks recalibrated.
 *
 * Raise this whenever a rule change would alter the result of a round that
 * has already been scored.
 */
export const ENGINE_VERSION = 3;
