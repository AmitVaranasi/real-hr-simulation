"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Eye } from "lucide-react";
import { FilterCard } from "@/components/instructor/ClassPerformanceShared";
import { ProfessorPageHeader } from "@/components/instructor/ProfessorShell";
import { REPORT_TABS } from "@/components/portal/ReportTabsBar";
import { rememberSelectedTeam } from "@/lib/instructor/selected-team";
import {
  type ProfessorReportView,
  workforceBriefHref,
} from "@/lib/instructor/workforce-brief-nav";

export function ProfessorWorkforceBriefControls({
  teams,
  selectedTeamId,
  rounds,
  selectedRoundId,
  view,
}: {
  teams: Array<{ id: string; name: string }>;
  selectedTeamId: string | null;
  rounds: Array<{ roundId: string; label: string }>;
  selectedRoundId: string | null;
  view: ProfessorReportView;
}) {
  const router = useRouter();

  // Iteration 5 §15: keep the professor's team selection across teaching pages.
  useEffect(() => {
    if (selectedTeamId) rememberSelectedTeam(selectedTeamId);
  }, [selectedTeamId]);

  return (
    <div className="space-y-4">
      <ProfessorPageHeader
        title="Workforce Brief"
        subtitle="The workforce profile, HR performance, and outcomes for a selected team and round."
        breadcrumbs={[
          { label: "Dashboard", href: "/sessions" },
          { label: "Class Performance", href: "/sessions/class-performance" },
          { label: "Workforce Brief" },
        ]}
        actions={
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--portal-accent-blue)]/40 bg-[var(--portal-accent-blue-soft)] px-3 py-1 text-xs font-semibold text-[var(--portal-accent-blue)]"
            title="Professors see exactly what the team sees. Student submissions and simulation data cannot be changed from this page."
          >
            <Eye className="h-3.5 w-3.5" />
            Professor View – Read Only
          </span>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <FilterCard
          label="Team"
          hint="Team"
          value={selectedTeamId ?? ""}
          onChange={(team) =>
            // A different team has different rounds: drop the round choice.
            router.push(workforceBriefHref({ team, view }))
          }
        >
          {teams.length === 0 ? <option value="">No teams yet</option> : null}
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </FilterCard>
        <FilterCard
          label="Round"
          hint="Round"
          value={selectedRoundId ?? ""}
          onChange={(round) =>
            router.push(
              workforceBriefHref({ team: selectedTeamId, round, view })
            )
          }
        >
          {rounds.length === 0 ? (
            <option value="">No completed rounds</option>
          ) : null}
          {rounds.map((r) => (
            <option key={r.roundId} value={r.roundId}>
              {r.label}
            </option>
          ))}
        </FilterCard>
      </div>

      <nav
        aria-label="Team reports"
        className="flex overflow-x-auto border-b border-[var(--portal-sidebar-border)]"
      >
        {REPORT_TABS.map((tab) => {
          // "/reports/balance-sheet" → "balance-sheet"
          const key = tab.href.split("/").pop() as ProfessorReportView;
          const Icon = tab.icon;
          const active = key === view;
          return (
            <Link
              key={key}
              href={workforceBriefHref({
                team: selectedTeamId,
                round: selectedRoundId,
                view: key,
              })}
              className={`relative flex shrink-0 items-center gap-1.5 px-3 py-2.5 text-[0.8125rem] font-semibold whitespace-nowrap ${
                active
                  ? "text-[var(--portal-primary)]"
                  : "text-[var(--portal-ink)] hover:text-[var(--portal-primary)]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
              {tab.label}
              {active ? (
                <span className="absolute inset-x-2 bottom-0 h-[3px] rounded-t bg-[var(--portal-primary)]" />
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
