import { ProfessorWorkforceBriefControls } from "@/components/instructor/ProfessorWorkforceBriefControls";
import { BalanceSheetView } from "@/components/reports/BalanceSheetView";
import { CashFlowView } from "@/components/reports/CashFlowView";
import { FinancialRatiosView } from "@/components/reports/FinancialRatiosView";
import { ProfitLossView } from "@/components/reports/ProfitLossView";
import { WorkforceBriefClient } from "@/components/results/WorkforceBriefClient";
import {
  loadActiveCourse,
  requireInstructor,
} from "@/lib/instructor/load-course-context";
import { selectedTeamId as rememberedTeamId } from "@/lib/instructor/selected-team";
import {
  PROFESSOR_REPORT_VIEWS,
  type ProfessorReportView,
  workforceBriefHref,
} from "@/lib/instructor/workforce-brief-nav";
import { loadFinancialReportDataForTeam } from "@/lib/reports/load-report-data";
import {
  outcomeToBriefData,
  outcomesToRoundList,
} from "@/lib/results/workforce-brief-data";

export const dynamic = "force-dynamic";

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <section className="rounded-xl border border-dashed border-[var(--portal-sidebar-border)] bg-white p-8 text-center">
      <h2 className="text-lg font-bold text-[var(--portal-title)]">{title}</h2>
      <p className="mt-2 text-sm text-[var(--portal-muted)]">{body}</p>
    </section>
  );
}

/**
 * Class Performance › Workforce Brief — the professor's read-only copy of the
 * student Workforce Brief and financial reports, for any team and completed
 * round in the course. It renders the same components from the same mapping
 * as the student portal, so both see identical results.
 */
export default async function ProfessorWorkforceBriefPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string; round?: string; view?: string }>;
}) {
  const params = await searchParams;
  const course = await loadActiveCourse();
  const { supabase } = await requireInstructor(
    "/sessions/class-performance/workforce-brief"
  );

  const view: ProfessorReportView = (
    PROFESSOR_REPORT_VIEWS as readonly string[]
  ).includes(params.view ?? "")
    ? (params.view as ProfessorReportView)
    : "workforce-brief";

  const { data: teamRows } =
    course && course.teamIds.length > 0
      ? await supabase
          .from("teams")
          .select("id, name, industry, strategy")
          .in("id", course.teamIds)
          .order("name")
      : { data: [] };
  const teams = (teamRows ?? []) as Array<{
    id: string;
    name: string;
    industry: string;
    strategy: string;
  }>;

  // URL first, then the team the professor was last teaching from, then the
  // first team — and never a team outside this course.
  const teamIds = teams.map((t) => t.id);
  const remembered = await rememberedTeamId(teamIds);
  const team =
    teams.find((t) => t.id === params.team) ??
    teams.find((t) => t.id === remembered) ??
    teams[0] ??
    null;

  // Completed rounds only: a scored outcome exists once the round is closed
  // and the team had submitted decisions.
  const { data: fetched } = team
    ? await supabase
        .from("outcomes")
        .select("*, rounds(id, round_number, round_type, status, closed_at)")
        .eq("team_id", team.id)
    : { data: [] };
  const roundNumberOf = (o: Record<string, unknown>) =>
    Number((o.rounds as { round_number?: number } | null)?.round_number ?? 0);
  const outcomes = [...(fetched ?? [])].sort(
    (a, b) => roundNumberOf(a) - roundNumberOf(b)
  );
  const outcome =
    outcomes.find((o) => o.round_id === params.round) ??
    outcomes[outcomes.length - 1] ??
    null;
  const selectedRoundId = (outcome?.round_id as string | undefined) ?? null;

  const controls = (
    <ProfessorWorkforceBriefControls
      teams={teams.map((t) => ({ id: t.id, name: t.name }))}
      selectedTeamId={team?.id ?? null}
      rounds={outcomes.map((o) => {
        const r = o.rounds as { round_type?: string } | null;
        const kind = r?.round_type === "practice" ? " (Practice)" : "";
        return {
          roundId: o.round_id as string,
          label: `Round ${roundNumberOf(o)}${kind}`,
        };
      })}
      selectedRoundId={selectedRoundId}
      view={view}
    />
  );

  if (!course) {
    return (
      <div className="space-y-5">
        {controls}
        <Notice
          title="No course yet"
          body="Create a course and add teams to review their Workforce Briefs."
        />
      </div>
    );
  }
  if (!team) {
    return (
      <div className="space-y-5">
        {controls}
        <Notice
          title="No teams in this course"
          body="Add teams under Course Management › Teams & Enrollment."
        />
      </div>
    );
  }
  if (!outcome) {
    return (
      <div className="space-y-5">
        {controls}
        <Notice
          title={`No results yet for ${team.name}`}
          body="A team's Workforce Brief appears after you close a round in which the team submitted decisions."
        />
      </div>
    );
  }

  let body: React.ReactNode;
  if (view === "workforce-brief") {
    const { data: reflection } = await supabase
      .from("reflections")
      .select("content")
      .eq("team_id", team.id)
      .eq("round_id", selectedRoundId)
      .maybeSingle();

    body = (
      <WorkforceBriefClient
        readOnly
        data={{
          ...outcomeToBriefData(team, outcome, roundNumberOf(outcome)),
          rounds: outcomesToRoundList(outcomes, (roundId) =>
            workforceBriefHref({ team: team.id, round: roundId })
          ),
          roundsTotal:
            course.practiceRounds + course.competitiveRounds || undefined,
          selectedRoundId,
          reflectionContent: reflection?.content ?? null,
        }}
        sessionName={course.name}
        team={team}
        outcome={outcome}
      />
    );
  } else {
    const data = await loadFinancialReportDataForTeam(
      team.id,
      workforceBriefHref({ team: team.id, view }),
      selectedRoundId
    );
    const common = {
      backHref: workforceBriefHref({ team: team.id, round: selectedRoundId }),
      roundNumber: data.roundNumber,
      asOfLabel: data.asOfLabel,
      rounds: data.rounds,
      selectedRoundId: data.selectedRoundId,
      liveRevenue: data.liveRevenue,
    };
    body =
      view === "balance-sheet" ? (
        <BalanceSheetView
          {...common}
          liveCompensation={data.liveCompensation}
          liveTurnover={data.liveTurnover}
        />
      ) : view === "profit-loss" ? (
        <ProfitLossView
          {...common}
          liveProfit={data.liveProfit}
          liveCompensation={data.liveCompensation}
          liveTurnover={data.liveTurnover}
          liveHeadcount={data.liveHeadcount}
        />
      ) : view === "cash-flow" ? (
        <CashFlowView {...common} liveCompensation={data.liveCompensation} />
      ) : (
        <FinancialRatiosView
          {...common}
          liveProfit={data.liveProfit}
          liveProfitMargin={data.liveProfitMargin}
          liveHeadcount={data.liveHeadcount}
        />
      );
  }

  return (
    <div className="space-y-5">
      {controls}
      {body}
    </div>
  );
}
