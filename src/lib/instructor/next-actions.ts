/**
 * Contextual NEXT ACTIONS for the professor rail.
 *
 * Iteration 5 §11: "Do not display every possible action simultaneously.
 * Prioritize actions based on the current round state." §5 gives the mapping:
 * during decision-making -> make/view HR decisions; near submission -> review
 * team submissions; after round close -> compute/view results; during debrief
 * -> view round insights. §5 also caps the rail: "Its purpose is action, not
 * additional analytics."
 */

export type RoundLifecycle =
  | "no-round"
  | "deciding"
  | "awaiting-close"
  | "processed";

export type NextAction = {
  title: string;
  body: string;
  href: string;
  label: string;
  primary?: boolean;
  /** True when the action opens the SELECTED TEAM rather than the class. */
  teamScoped?: boolean;
};

export type NextActionContext = {
  sessionId: string;
  lifecycle: RoundLifecycle;
  teamsSubmitted: number;
  teamsTotal: number;
  selectedTeamId: string | null;
  selectedTeamName: string | null;
  openRoundId: string | null;
  latestClosedRoundId: string | null;
};

/** Derive the lifecycle from round records — one definition, used everywhere. */
export function roundLifecycle(input: {
  hasOpenRound: boolean;
  hasClosedRound: boolean;
  teamsSubmitted: number;
  teamsTotal: number;
}): RoundLifecycle {
  if (input.hasOpenRound) {
    const allIn =
      input.teamsTotal > 0 && input.teamsSubmitted >= input.teamsTotal;
    return allIn ? "awaiting-close" : "deciding";
  }
  return input.hasClosedRound ? "processed" : "no-round";
}

/** The rail stays concise: at most three actions, most urgent first. */
export const MAX_RAIL_ACTIONS = 3;

export function nextActions(ctx: NextActionContext): NextAction[] {
  const rounds = `/sessions/${ctx.sessionId}/rounds`;
  const team = ctx.selectedTeamId;
  const teamName = ctx.selectedTeamName ?? "the selected team";
  const actions: NextAction[] = [];

  if (ctx.lifecycle === "no-round") {
    actions.push({
      title: "Open Round",
      body: "Open the next practice or competitive decision window.",
      href: rounds,
      label: "Go to Round Management",
      primary: true,
    });
  }

  if (ctx.lifecycle === "deciding") {
    // §5: during decision-making the professor works inside a team.
    if (team) {
      actions.push({
        title: "Make HR Decisions",
        body: `Explore ${teamName}'s HR decision environment.`,
        href: `/sessions/teams/${team}/decisions`,
        label: "Open HR Decisions",
        primary: true,
        teamScoped: true,
      });
    }
    actions.push({
      title: "Review & Submit",
      body: `${ctx.teamsSubmitted} of ${ctx.teamsTotal} teams have submitted.`,
      href: `/sessions/${ctx.sessionId}/teams`,
      label: "Review Submissions",
      primary: !team,
    });
  }

  if (ctx.lifecycle === "awaiting-close") {
    actions.push({
      title: "Close Round",
      body: "Every team has submitted. Close the window to process results.",
      href: rounds,
      label: "Close & Process Round",
      primary: true,
    });
    actions.push({
      title: "Review & Submit",
      body: "Check each team's submission before processing.",
      href: `/sessions/${ctx.sessionId}/teams`,
      label: "Review Submissions",
    });
  }

  if (ctx.lifecycle === "processed") {
    actions.push({
      title: "View Round Insights",
      body: "Turn processed results into teaching points.",
      href: "/sessions/teaching/round-insights",
      label: "Open Round Insights",
      primary: true,
    });
    actions.push({
      title: "Begin Debrief",
      body: "Open the discussion outline for this class.",
      href: "/sessions/teaching/debrief",
      label: "Begin Debrief",
    });
  }

  // Team Discussion is available wherever a team is selected — it is the
  // bridge from course management into individual-team teaching (§5).
  if (team) {
    actions.push({
      title: "Team Discussion",
      body: `Open ${teamName}'s discussion and reflection context.`,
      href: "/sessions/teaching/team-insights",
      label: "Open Team Discussion",
      teamScoped: true,
    });
  }

  return actions.slice(0, MAX_RAIL_ACTIONS);
}
