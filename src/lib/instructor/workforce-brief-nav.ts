/** URLs for the professor's read-only Workforce Brief (Class Performance). */

export const WORKFORCE_BRIEF_PATH = "/sessions/class-performance/workforce-brief";

/** The report tabs, keyed by the `view` query value the page understands. */
export const PROFESSOR_REPORT_VIEWS = [
  "workforce-brief",
  "balance-sheet",
  "profit-loss",
  "cash-flow",
  "financial-ratios",
] as const;
export type ProfessorReportView = (typeof PROFESSOR_REPORT_VIEWS)[number];

export function workforceBriefHref(params: {
  team?: string | null;
  round?: string | null;
  view?: ProfessorReportView;
}) {
  const q = new URLSearchParams();
  if (params.team) q.set("team", params.team);
  if (params.round) q.set("round", params.round);
  if (params.view && params.view !== "workforce-brief") q.set("view", params.view);
  const qs = q.toString();
  return qs ? `${WORKFORCE_BRIEF_PATH}?${qs}` : WORKFORCE_BRIEF_PATH;
}
