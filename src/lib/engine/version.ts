/**
 * Version of the scoring rules. Every stored result records the version that
 * produced it (`trace_json.engine_version`), so a change in the rules applies
 * to rounds scored from then on and never rewrites a result already stored.
 *
 * 1 — original rules (results stored without a version).
 * 2 — payroll deducted once from profit; revenue driven by the preliminary HR
 *     performance score through the industry multiplier.
 *
 * Raise this whenever a rule change would alter the result of a round that
 * has already been scored.
 */
export const ENGINE_VERSION = 2;
