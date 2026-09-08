"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  MoreVertical,
  Pencil,
  Target,
  Upload,
  UserPlus,
  UserRound,
  Users,
} from "lucide-react";
import { CreateTeamForm } from "@/components/instructor/CreateTeamForm";
import { EditTeamForm } from "@/components/instructor/EditTeamForm";
import {
  ProfessorFilterBar,
  ProfessorHelpBanner,
  ProfessorPageGrid,
  ProfessorStandardRail,
  ProfessorStatRow,
  ProfessorTabBar,
  type CourseRailState,
  plural,
} from "@/components/instructor/ProfessorChrome";
import { ProfessorPageHeader } from "@/components/instructor/ProfessorShell";
import { formSelectClassName } from "@/components/ui/form-controls";
import type { Industry, Strategy } from "@/lib/engine/types";

export type TeamRow = {
  id: string;
  name: string;
  join_code: string;
  industry: Industry;
  strategy: Strategy;
  members: string[];
};

export function TeamsEnrollmentHub({
  sessionId,
  teams,
  competitiveRounds,
  practiceRounds,
  rail,
}: {
  sessionId: string;
  teams: TeamRow[];
  competitiveRounds: number;
  practiceRounds: number;
  rail: CourseRailState;
}) {
  const [tab, setTab] = useState<"teams" | "enrollment">("teams");
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<"assign" | "invite" | null>(null);
  const [query, setQuery] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [strategyFilter, setStrategyFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "members" | "industry">("name");

  const enrolled = useMemo(
    () => teams.reduce((sum, t) => sum + t.members.length, 0),
    [teams]
  );

  const industries = useMemo(
    () => [...new Set(teams.map((t) => t.industry).filter(Boolean))],
    [teams]
  );
  const strategies = useMemo(
    () => [...new Set(teams.map((t) => t.strategy).filter(Boolean))],
    [teams]
  );

  const visibleTeams = useMemo(() => {
    const rows = teams.filter((team) => {
      if (industryFilter !== "all" && team.industry !== industryFilter) {
        return false;
      }
      if (strategyFilter !== "all" && team.strategy !== strategyFilter) {
        return false;
      }
      if (query) {
        const hay = `${team.name} ${team.members.join(" ")} ${team.industry} ${team.strategy}`;
        if (!hay.toLowerCase().includes(query.toLowerCase())) return false;
      }
      return true;
    });
    return [...rows].sort((a, b) => {
      if (sortBy === "members") return b.members.length - a.members.length;
      if (sortBy === "industry") return a.industry.localeCompare(b.industry);
      return a.name.localeCompare(b.name);
    });
  }, [industryFilter, query, sortBy, strategyFilter, teams]);

  function exportCsv() {
    const header = "Team Name,Members,Industry,Strategy,Join Code";
    const rows = teams.map((t) =>
      [
        csv(t.name),
        csv(t.members.join("; ") || "—"),
        csv(t.industry),
        csv(t.strategy),
        csv(t.join_code),
      ].join(",")
    );
    download(`teams-${sessionId}.csv`, [header, ...rows].join("\n"));
  }

  return (
    <ProfessorPageGrid
      rail={
        <ProfessorStandardRail
          toolsTitle="Team Tools"
          course={rail}
          tools={[
            {
              title: "Auto-Assign Teams",
              body: "Automatically create teams and assign students.",
              action: "Auto-Assign",
              onClick: () => setDialog("assign"),
              icon: <Users className="h-4 w-4" strokeWidth={1.75} />,
            },
            {
              title: "Invite Students",
              body: "Add students to the course and send invitations.",
              action: "Invite Students",
              onClick: () => setDialog("invite"),
              icon: <UserPlus className="h-4 w-4" strokeWidth={1.75} />,
            },
            {
              title: "Export Team List",
              body: "Download your team roster and details.",
              action: "Export",
              onClick: exportCsv,
              icon: <Upload className="h-4 w-4" strokeWidth={1.75} />,
            },
          ]}
        />
      }
    >
      <ProfessorPageHeader
        title="Teams & Enrollment"
        subtitle="Create and manage teams, review enrollment, and monitor team composition."
        breadcrumbs={[
          { label: "Dashboard", href: "/sessions" },
          { label: "Course Management", href: "/sessions/manage" },
          { label: "Teams & Enrollment" },
        ]}
        actions={
          <Link
            href={`/sessions/${sessionId}/course`}
            className="inline-flex items-center gap-2 rounded-md border border-[var(--portal-accent-blue)] px-3.5 py-2 text-sm font-semibold text-[var(--portal-accent-blue)]"
          >
            <Pencil className="h-4 w-4" />
            Team Settings
          </Link>
        }
      />

      <ProfessorTabBar
        active={tab}
        onChange={(id) => setTab(id as "teams" | "enrollment")}
        tabs={[
          { id: "teams", label: "Teams" },
          { id: "enrollment", label: "Enrollment" },
        ]}
      />

      {/* Order + composition follow professor_teams_enrollment_editable_corrected. */}
      <ProfessorStatRow
        variant="figure"
        tiles={[
          {
            label: "Total Teams",
            value: String(teams.length),
            icon: <Users className="h-5 w-5" strokeWidth={1.75} />,
            iconWrap: "bg-[#efe9fd] text-[#7c3aed]",
          },
          {
            label: "Students Enrolled",
            value: String(enrolled),
            icon: <UserRound className="h-5 w-5" strokeWidth={1.75} />,
            iconWrap:
              "bg-[var(--portal-accent-blue-soft)] text-[var(--portal-accent-blue)]",
          },
          {
            label: "Competitive Rounds",
            value: String(competitiveRounds),
            icon: <CheckCircle2 className="h-5 w-5" strokeWidth={1.75} />,
            iconWrap: "bg-[#e6f5ec] text-[#16a34a]",
          },
          {
            label: "Practice Round",
            value: String(practiceRounds),
            icon: <Target className="h-5 w-5" strokeWidth={1.75} />,
            iconWrap: "bg-[#fdece2] text-[var(--portal-brand)]",
          },
        ]}
      />

      <ProfessorFilterBar
        search={query}
        onSearch={setQuery}
        searchPlaceholder={
          tab === "teams" ? "Search teams..." : "Search students..."
        }
      >
        <select
          className={`${formSelectClassName} min-w-0`}
          value={industryFilter}
          onChange={(e) => setIndustryFilter(e.target.value)}
        >
          <option value="all">All Industries</option>
          {industries.map((industry) => (
            <option key={industry} value={industry}>
              {industry}
            </option>
          ))}
        </select>
        <select
          className={`${formSelectClassName} min-w-0`}
          value={strategyFilter}
          onChange={(e) => setStrategyFilter(e.target.value)}
        >
          <option value="all">All Strategies</option>
          {strategies.map((strategy) => (
            <option key={strategy} value={strategy}>
              {strategy}
            </option>
          ))}
        </select>
        <select
          className={`${formSelectClassName} min-w-0`}
          value={sortBy}
          onChange={(e) =>
            setSortBy(e.target.value as "name" | "members" | "industry")
          }
        >
          <option value="name">Sort: Name</option>
          <option value="members">Sort: Members</option>
          <option value="industry">Sort: Industry</option>
        </select>
      </ProfessorFilterBar>

      {tab === "teams" ? (
        <>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[var(--portal-title)]">
              Your Teams
            </h2>
            <p className="text-sm text-[var(--portal-muted)]">
              Manage team details and composition.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate((v) => !v)}
            className="rounded-md bg-[var(--portal-accent-blue)] px-3.5 py-2 text-sm font-semibold text-white"
          >
            + Create Team
          </button>
        </div>
        {showCreate ? (
          <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
            <CreateTeamForm sessionId={sessionId} />
          </section>
        ) : null}
        <section className="overflow-hidden rounded-xl border border-[var(--portal-sidebar-border)] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f8f9fb] text-[0.8125rem] font-semibold text-[var(--portal-muted)]">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap">Team Name</th>
                  <th className="px-4 py-3 whitespace-nowrap">Members</th>
                  <th className="px-4 py-3 whitespace-nowrap">Industry</th>
                  <th className="px-4 py-3 whitespace-nowrap">Strategy</th>
                  <th className="px-4 py-3 whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleTeams.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-[var(--portal-muted)]"
                    >
                      No teams yet. Create a team to generate a join code.
                    </td>
                  </tr>
                ) : (
                  visibleTeams.map((team) => (
                    <tr
                      key={team.id}
                      className="border-t border-[var(--portal-sidebar-border)] align-top"
                    >
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId((id) =>
                              id === team.id ? null : team.id
                            )
                          }
                          className="font-semibold text-[var(--portal-accent-blue)] hover:underline"
                        >
                          {team.name}
                        </button>
                        <p className="mt-0.5 text-[0.75rem] text-[var(--portal-muted)]">
                          {plural(team.members.length, "member")}
                        </p>
                        {expandedId === team.id ? (
                          <div className="mt-3">
                            <EditTeamForm sessionId={sessionId} team={team} />
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-[var(--portal-ink)]">
                        {team.members.length
                          ? team.members.join(", ")
                          : "—"}
                      </td>
                      <td className="px-4 py-3">{team.industry}</td>
                      <td className="px-4 py-3">{team.strategy}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[0.6875rem] font-semibold text-emerald-800">
                          Active
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId((id) =>
                              id === team.id ? null : team.id
                            )
                          }
                          className="leading-none text-[var(--portal-muted)]"
                          aria-label={`Actions for ${team.name}`}
                        >
                          <MoreVertical className="h-4 w-4" strokeWidth={2} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
        {/* "View All Teams" — professor_teams_enrollment_editable_corrected. */}
        <div className="flex justify-center">
          <Link
            href={`/sessions/${sessionId}/teams`}
            className="rounded-md border border-[var(--portal-accent-blue)] px-4 py-2 text-sm font-semibold text-[var(--portal-accent-blue)] hover:bg-[var(--portal-accent-blue-soft)]"
          >
            View All Teams
          </Link>
        </div>
        </>
      ) : (
        <>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[var(--portal-title)]">
              Enrollment
            </h2>
            <p className="text-sm text-[var(--portal-muted)]">
              Students join a team with its join code. There is no separate
              roster outside team membership.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDialog("invite")}
            className="rounded-md bg-[var(--portal-accent-blue)] px-3.5 py-2 text-sm font-semibold text-white"
          >
            Invite Students
          </button>
        </div>
        <section className="overflow-hidden rounded-xl border border-[var(--portal-sidebar-border)] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f8f9fb] text-[0.8125rem] font-semibold text-[var(--portal-muted)]">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap">Student</th>
                  <th className="px-4 py-3 whitespace-nowrap">Team</th>
                  <th className="px-4 py-3 whitespace-nowrap">Join Code</th>
                </tr>
              </thead>
              <tbody>
                {visibleTeams.every((t) => t.members.length === 0) ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-8 text-center text-[var(--portal-muted)]"
                    >
                      No students enrolled yet.
                    </td>
                  </tr>
                ) : (
                  visibleTeams.flatMap((team) =>
                    team.members.length === 0
                      ? [
                          <tr
                            key={`${team.id}-empty`}
                            className="border-t border-[var(--portal-sidebar-border)]"
                          >
                            <td className="px-4 py-3 text-[var(--portal-muted)]">
                              —
                            </td>
                            <td className="px-4 py-3">{team.name}</td>
                            <td className="px-4 py-3 font-mono text-xs">
                              {team.join_code}
                            </td>
                          </tr>,
                        ]
                      : team.members.map((member) => (
                          <tr
                            key={`${team.id}-${member}`}
                            className="border-t border-[var(--portal-sidebar-border)]"
                          >
                            <td className="px-4 py-3">{member}</td>
                            <td className="px-4 py-3">{team.name}</td>
                            <td className="px-4 py-3 font-mono text-xs">
                              {team.join_code}
                            </td>
                          </tr>
                        ))
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>
        </>
      )}

      <ProfessorHelpBanner
        title="Need help managing teams?"
        body="Visit the Professor Guide for step-by-step instructions on creating teams and sharing join codes."
      />

      {dialog === "assign" ? (
        <Modal title="Auto-Assign Teams" onClose={() => setDialog(null)}>
          <p className="text-sm text-[var(--portal-muted)]">
            Auto-assign proposes a grouping first. Nothing is committed until
            you confirm. Students currently join through team codes, and this
            course has no unassigned student roster to place.
          </p>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-[var(--portal-muted)]">Teams</dt>
              <dd>{teams.length}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--portal-muted)]">Students enrolled</dt>
              <dd>{enrolled}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--portal-muted)]">Unassigned students</dt>
              <dd>—</dd>
            </div>
          </dl>
          <p className="mt-4 text-sm font-medium text-[var(--portal-title)]">
            Proposed change: none.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDialog(null)}
              className="rounded-md border border-[var(--portal-sidebar-border)] px-3 py-2 text-sm font-semibold"
            >
              Close
            </button>
          </div>
        </Modal>
      ) : null}

      {dialog === "invite" ? (
        <Modal title="Invite Students" onClose={() => setDialog(null)}>
          <p className="text-sm text-[var(--portal-muted)]">
            Share a team join code. Students use it on the join page. No
            separate invitation system exists.
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {teams.length === 0 ? (
              <li className="text-[var(--portal-muted)]">
                Create a team first to generate a join code.
              </li>
            ) : (
              teams.map((team) => (
                <li
                  key={team.id}
                  className="flex items-center justify-between gap-3 rounded-md bg-[#f8f9fb] px-3 py-2"
                >
                  <span className="flex items-center gap-2 font-medium">
                    <Users className="h-3.5 w-3.5 text-[var(--portal-muted)]" />
                    {team.name}
                  </span>
                  <span className="font-mono text-xs">{team.join_code}</span>
                </li>
              ))
            )}
          </ul>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => setDialog(null)}
              className="rounded-md border border-[var(--portal-sidebar-border)] px-3 py-2 text-sm font-semibold"
            >
              Close
            </button>
          </div>
        </Modal>
      ) : null}
    </ProfessorPageGrid>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div
        role="dialog"
        aria-modal
        className="w-full max-w-md rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-lg"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="text-base font-bold text-[var(--portal-title)]">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--portal-muted)]"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function csv(value: string) {
  if (value.includes(",") || value.includes('"')) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

function download(name: string, body: string) {
  const blob = new Blob([body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
