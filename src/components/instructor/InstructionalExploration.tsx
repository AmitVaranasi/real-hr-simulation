"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  FlaskConical,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formSelectClassName } from "@/components/ui/form-controls";
import {
  ProfessorPageGrid,
  ProfessorStandardRail,
  type CourseRailState,
} from "@/components/instructor/ProfessorChrome";
import { ProfessorPageHeader } from "@/components/instructor/ProfessorShell";
import type { BSCScores, Decision } from "@/lib/engine/types";

type TeamInfo = {
  id: string;
  name: string;
  industry: string;
  strategy: string;
};

type ExploreResult = {
  actual: { bsc_scores: BSCScores };
  explored: { bsc_scores: BSCScores };
};

/**
 * The levers the sandbox exposes: every scalar or enum the engine reads.
 * Role-level arrays (positions to fill, per-role pay and ratings) stay as the
 * team set them — they are shown for context, not edited, so a discussion
 * never turns into a rebuild of the team's staffing plan.
 */
const LEVERS: Array<{
  key: keyof Decision;
  label: string;
  module: string;
  kind: "number" | "select" | "toggle";
  options?: Array<{ value: string | number | boolean; label: string }>;
  min?: number;
  max?: number;
  step?: number;
}> = [
  { key: "screening_rigor", label: "Screening Rigor", module: "Recruitment & Selection", kind: "select", options: [
    { value: 1, label: "1 — Basic" },
    { value: 2, label: "2 — Standard" },
    { value: 3, label: "3 — Rigorous" },
  ] },
  { key: "diversity_goal_pct", label: "Diversity Goal (%)", module: "Recruitment & Selection", kind: "number", min: 0, max: 100, step: 1 },
  { key: "onboarding_investment", label: "Onboarding Investment ($)", module: "Recruitment & Selection", kind: "number", min: 0, step: 1000 },
  { key: "review_frequency", label: "Review Frequency (per year)", module: "Performance Management", kind: "select", options: [
    { value: 1, label: "1 — Annual" },
    { value: 2, label: "2 — Semi-annual" },
    { value: 4, label: "4 — Quarterly" },
  ] },
  { key: "feedback_360", label: "360° Feedback", module: "Performance Management", kind: "toggle" },
  { key: "pct_employees_trained", label: "Employees Trained (%)", module: "Training & Development", kind: "number", min: 0, max: 100, step: 1 },
  { key: "training_budget_per_ee", label: "Training Budget / Employee ($)", module: "Training & Development", kind: "number", min: 0, step: 100 },
  { key: "succession_investment", label: "Succession Investment ($)", module: "Training & Development", kind: "number", min: 0, step: 1000 },
  { key: "engagement_investment", label: "Engagement Investment ($)", module: "Employee Relations", kind: "number", min: 0, step: 1000 },
  { key: "conflict_approach", label: "Conflict Approach", module: "Employee Relations", kind: "select", options: [
    { value: "mediation", label: "Mediation" },
    { value: "coaching", label: "Coaching" },
    { value: "disciplinary", label: "Disciplinary" },
  ] },
  { key: "flexibility_level", label: "Flexibility Level", module: "Employee Relations", kind: "select", options: [
    { value: 0, label: "0 — None" },
    { value: 1, label: "1 — Partial" },
    { value: 2, label: "2 — Full" },
  ] },
  { key: "voice_mechanisms", label: "Voice Mechanisms", module: "Employee Relations", kind: "select", options: [
    { value: 0, label: "0 — None" },
    { value: 1, label: "1 — Some" },
    { value: 2, label: "2 — Extensive" },
  ] },
  { key: "benefits_pct", label: "Benefits (% of salary)", module: "Compensation & Benefits", kind: "number", min: 0, max: 60, step: 1 },
  { key: "bonus_tier", label: "Bonus Tier (%)", module: "Compensation & Benefits", kind: "select", options: [
    { value: 5, label: "5%" },
    { value: 10, label: "10%" },
    { value: 15, label: "15%" },
  ] },
  { key: "equity_level", label: "Equity Level", module: "Compensation & Benefits", kind: "select", options: [
    { value: 0, label: "0 — None" },
    { value: 1, label: "1 — Partial" },
    { value: 2, label: "2 — Broad" },
  ] },
  { key: "hr_tech_level", label: "HR Technology Level", module: "Org Design & Change", kind: "select", options: [
    { value: 0, label: "0 — Manual" },
    { value: 1, label: "1 — Partial" },
    { value: 2, label: "2 — Integrated" },
  ] },
];

const MODULES = [...new Set(LEVERS.map((l) => l.module))];

function ScoreDelta({ from, to }: { from: number; to: number }) {
  const delta = to - from;
  const near = Math.abs(delta) < 0.05;
  return (
    <span
      className={`font-semibold tabular-nums ${
        near
          ? "text-[var(--portal-muted)]"
          : delta > 0
            ? "text-emerald-700"
            : "text-red-700"
      }`}
    >
      {near ? "no change" : `${delta > 0 ? "+" : "−"}${Math.abs(delta).toFixed(1)}`}
    </span>
  );
}

export function InstructionalExploration({
  rail,
  sessionId,
  team,
  roundId,
  roundLabel,
  submitted,
  decision,
}: {
  rail: CourseRailState;
  sessionId: string;
  team: TeamInfo;
  roundId: string | null;
  roundLabel: string;
  submitted: boolean;
  decision: Decision | null;
  teams?: TeamInfo[];
}) {
  // The temporary professor instructional copy (Iteration 5 §13). It lives in
  // this component and nowhere else — leaving the page discards it.
  const [draft, setDraft] = useState<Partial<Decision>>({});
  const [result, setResult] = useState<ExploreResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changed = Object.keys(draft).length;
  const valueOf = (key: keyof Decision) =>
    (draft[key] ?? decision?.[key]) as string | number | boolean | undefined;

  function setLever(key: keyof Decision, value: string | number | boolean) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setResult(null);
  }

  function discard() {
    setDraft({});
    setResult(null);
    setError(null);
  }

  async function runWhatIf() {
    if (!roundId) return;
    setRunning(true);
    setError(null);
    const res = await fetch(
      `/api/sessions/${sessionId}/explore/${team.id}/${roundId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overrides: draft }),
      }
    );
    const data = await res.json().catch(() => ({}));
    setRunning(false);
    if (!res.ok) {
      setError(data.error ?? "Could not run the what-if.");
      return;
    }
    setResult(data as ExploreResult);
  }

  return (
    <ProfessorPageGrid
      rail={
        <ProfessorStandardRail
          toolsTitle="Team Context"
          course={rail}
          tools={[
            {
              title: "Team Insights",
              icon: <Users className="h-4 w-4" strokeWidth={1.75} />,
              body: `Strengths and opportunities for ${team.name}.`,
              action: "Open Team Insights",
              href: "/sessions/teaching/team-insights",
            },
            {
              title: "Formula Inspect",
              icon: <Sparkles className="h-4 w-4" strokeWidth={1.75} />,
              body: "Trace how this team's decisions produced its score.",
              action: "Open Inspect",
              href: `/sessions/${sessionId}/inspect?team=${team.id}`,
            },
          ]}
        />
      }
    >
      <ProfessorPageHeader
        title="Instructional Exploration"
        subtitle={`Explore alternative HR decisions with ${team.name} without changing anything they submitted.`}
        breadcrumbs={[
          { label: "Dashboard", href: "/sessions" },
          { label: team.name },
          { label: "Instructional Exploration" },
        ]}
      />

      {/*
        Iteration 5 §12 requires a clear distinction between student/team
        decisions and professor instructional exploration, so the page says
        outright which one the professor is looking at.
      */}
      <section className="flex items-start gap-3 rounded-xl border border-[#d7e4ff] bg-[#f5f9ff] p-4">
        <ShieldCheck
          className="mt-0.5 h-5 w-5 shrink-0 text-[var(--portal-accent-blue)]"
          strokeWidth={1.75}
        />
        <div>
          <p className="text-sm font-bold text-[var(--portal-accent-blue)]">
            Nothing here is recorded
          </p>
          <p className="mt-1 text-[0.8125rem] leading-snug text-[var(--portal-ink)]">
            Changes on this page are a temporary teaching copy. They do not
            overwrite {team.name}&apos;s decisions, do not count as a student
            edit, do not change submission timestamps, do not affect scoring,
            and never enter the team&apos;s decision history. Leaving the page
            discards them.
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-base font-bold text-[var(--portal-title)]">
              {team.name}
            </p>
            <p className="mt-0.5 text-[0.8125rem] text-[var(--portal-muted)]">
              {team.industry} · {team.strategy} · {roundLabel} ·{" "}
              {submitted ? "Submitted" : "Not yet submitted"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={discard}
              disabled={changed === 0 && !result}
              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--portal-sidebar-border)] px-3 py-2 text-xs font-semibold text-[var(--portal-ink)] disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
              Return to team state
            </button>
            <Button
              onClick={() => void runWhatIf()}
              disabled={running || !roundId || !decision || changed === 0}
            >
              <FlaskConical className="mr-1.5 h-4 w-4" />
              {running ? "Running…" : "Run What-If"}
            </Button>
          </div>
        </div>
        {changed > 0 ? (
          <p className="mt-3 text-[0.8125rem] font-semibold text-[var(--portal-brand)]">
            {changed} temporary change{changed === 1 ? "" : "s"} — not saved.
          </p>
        ) : null}
        {error ? (
          <p className="mt-3 flex items-start gap-2 text-[0.8125rem] text-[var(--portal-brand)]">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            {error}
          </p>
        ) : null}
      </section>

      {!decision ? (
        <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-[var(--portal-muted)]">
            {roundId
              ? `${team.name} has no decisions recorded for ${roundLabel} yet.`
              : "This course has no open or processed round to explore."}
          </p>
        </section>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="space-y-4">
            {MODULES.map((module) => (
              <article
                key={module}
                className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm"
              >
                <h2 className="text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--portal-title)]">
                  {module}
                </h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {LEVERS.filter((l) => l.module === module).map((lever) => {
                    const current = valueOf(lever.key);
                    const isChanged = lever.key in draft;
                    return (
                      <label key={String(lever.key)} className="block text-sm">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="font-semibold text-[var(--portal-ink)]">
                            {lever.label}
                          </span>
                          {isChanged ? (
                            <span className="text-[0.625rem] font-bold uppercase tracking-wide text-[var(--portal-brand)]">
                              Temporary
                            </span>
                          ) : null}
                        </span>
                        {lever.kind === "toggle" ? (
                          <select
                            className={`${formSelectClassName} mt-1.5 w-full`}
                            value={current ? "yes" : "no"}
                            onChange={(e) =>
                              setLever(lever.key, e.target.value === "yes")
                            }
                          >
                            <option value="no">No</option>
                            <option value="yes">Yes</option>
                          </select>
                        ) : lever.kind === "select" ? (
                          <select
                            className={`${formSelectClassName} mt-1.5 w-full`}
                            value={String(current ?? "")}
                            onChange={(e) => {
                              const raw = e.target.value;
                              const match = lever.options?.find(
                                (o) => String(o.value) === raw
                              );
                              setLever(lever.key, match ? match.value : raw);
                            }}
                          >
                            {lever.options?.map((o) => (
                              <option key={String(o.value)} value={String(o.value)}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="number"
                            className="mt-1.5 w-full rounded-md border border-[var(--portal-sidebar-border)] px-2.5 py-2 text-sm"
                            value={Number(current ?? 0)}
                            min={lever.min}
                            max={lever.max}
                            step={lever.step}
                            onChange={(e) =>
                              setLever(lever.key, Number(e.target.value))
                            }
                          />
                        )}
                      </label>
                    );
                  })}
                </div>
              </article>
            ))}
          </section>

          <aside className="space-y-4">
            <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
              <h2 className="text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--portal-title)]">
                What-If Result
              </h2>
              {!result ? (
                <p className="mt-3 text-[0.8125rem] text-[var(--portal-muted)]">
                  Change a decision and run the what-if. The projection uses the
                  same simulation engine as the live round, against this
                  team&apos;s real prior state.
                </p>
              ) : (
                <table className="mt-3 w-full text-left text-sm">
                  <thead className="text-[0.6875rem] font-bold uppercase tracking-wide text-[var(--portal-muted)]">
                    <tr>
                      <th className="py-1.5">Perspective</th>
                      <th className="py-1.5 text-right">Team</th>
                      <th className="py-1.5 text-right">What-If</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(
                      [
                        ["Overall", "total_score"],
                        ["Financial", "score_financial"],
                        ["Employee", "score_employee"],
                        ["Internal Process", "score_process"],
                        ["Learning & Growth", "score_learning"],
                      ] as Array<[string, keyof BSCScores]>
                    ).map(([label, key]) => (
                      <tr
                        key={key}
                        className="border-t border-[var(--portal-sidebar-border)]"
                      >
                        <td className="py-2">{label}</td>
                        <td className="py-2 text-right tabular-nums text-[var(--portal-muted)]">
                          {result.actual.bsc_scores[key].toFixed(1)}
                        </td>
                        <td className="py-2 text-right">
                          <span className="block tabular-nums font-semibold text-[var(--portal-title)]">
                            {result.explored.bsc_scores[key].toFixed(1)}
                          </span>
                          <ScoreDelta
                            from={result.actual.bsc_scores[key]}
                            to={result.explored.bsc_scores[key]}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <p className="mt-3 text-[0.6875rem] leading-snug text-[var(--portal-muted)]">
                Projection only. {team.name}&apos;s recorded score is unchanged.
              </p>
            </section>
            <Link
              href="/sessions"
              className="inline-flex w-full items-center justify-center rounded-md border border-[var(--portal-accent-blue)] px-3 py-2 text-xs font-semibold text-[var(--portal-accent-blue)]"
            >
              Exit without saving
            </Link>
          </aside>
        </div>
      )}
    </ProfessorPageGrid>
  );
}
