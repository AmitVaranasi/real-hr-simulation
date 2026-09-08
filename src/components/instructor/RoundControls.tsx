"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  Check,
  LayoutGrid,
  Play,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formSelectClassName } from "@/components/ui/form-controls";
import { DECISION_TABS } from "@/components/portal/portal-nav";
import {
  ProfessorFilterBar,
  ProfessorMetricStrip,
  ProfessorTabBar,
} from "@/components/instructor/ProfessorChrome";
import { DISCRETIONARY_BUDGET } from "@/lib/engine/defaults";
import {
  deadlineState,
  fromDateTimeLocal,
  toDateTimeLocal,
} from "@/lib/instructor/deadline";
import { formatCurrency } from "@/lib/utils";
import type { EconomyCondition } from "@/lib/engine/types";

export type RoundRow = {
  id: string;
  round_number: number;
  round_type: string;
  status: string;
  economy_condition: EconomyCondition;
  opened_at?: string | null;
  closed_at?: string | null;
  /** Iteration 5 §7: professor-set decision deadline. Null = not established. */
  decision_deadline?: string | null;
  submittedCount?: number;
};

interface RoundControlsProps {
  sessionId: string;
  teamCount: number;
  rounds: RoundRow[];
}

function statusLabel(status: string) {
  if (status === "open") return "Open";
  if (status === "closed") return "Completed";
  return "Upcoming";
}

function statusClass(status: string) {
  if (status === "open") {
    return "bg-emerald-100 text-emerald-800";
  }
  if (status === "closed") {
    return "bg-[#e8eaee] text-[#5b6475]";
  }
  return "bg-amber-100 text-amber-800";
}

function typeLabel(type: string) {
  return type === "practice" ? "Practice" : "Competitive";
}

function typeClass(type: string) {
  return type === "practice"
    ? "bg-[var(--portal-accent-blue-soft)] text-[var(--portal-accent-blue)]"
    : "bg-violet-100 text-violet-800";
}

function formatDay(iso?: string | null) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysFromNow(iso?: string | null) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return Math.round((date.getTime() - Date.now()) / 86_400_000);
}

function windowCopy(round: RoundRow) {
  const opened = formatDay(round.opened_at);
  const closed = formatDay(round.closed_at);
  const remaining = daysFromNow(round.closed_at);
  const untilStart = daysFromNow(round.opened_at);

  if (round.status === "closed") {
    return {
      primary: opened && closed ? `${opened} – ${closed}` : closed ?? opened ?? "—",
      secondary: "Completed",
      secondaryClass: "text-[var(--portal-muted)]",
    };
  }

  if (round.status === "open") {
    return {
      primary: opened && closed ? `${opened} – ${closed}` : opened ?? "—",
      secondary:
        remaining != null
          ? remaining > 0
            ? `${remaining} day${remaining === 1 ? "" : "s"} remaining`
            : remaining === 0
              ? "Due today"
              : "Past due"
          : "In progress",
      secondaryClass:
        remaining != null && remaining < 0
          ? "text-[var(--portal-brand)]"
          : "text-emerald-700",
    };
  }

  return {
    primary: opened && closed ? `${opened} – ${closed}` : "—",
    secondary:
      untilStart != null && untilStart > 0
        ? `Starts in ${untilStart} day${untilStart === 1 ? "" : "s"}`
        : "Not scheduled",
    secondaryClass:
      untilStart != null && untilStart > 0
        ? "text-amber-700"
        : "text-[var(--portal-muted)]",
  };
}

function economyLabel(economy: EconomyCondition) {
  if (economy === "boom") return "Boom";
  if (economy === "recession") return "Recession";
  return "Normal";
}

export function RoundControls({
  sessionId,
  teamCount,
  rounds,
}: RoundControlsProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const [tab, setTab] = useState<"all" | "practice" | "competitive" | "completed">(
    requestedTab === "practice" ||
      requestedTab === "competitive" ||
      requestedTab === "completed"
      ? requestedTab
      : "all"
  );
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"order" | "status" | "type">("order");
  const [showCreateNote, setShowCreateNote] = useState(false);
  const [newType, setNewType] = useState<"practice" | "competitive">(
    "competitive"
  );
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const ordered = [...rounds].sort((a, b) => a.round_number - b.round_number);
  const openCount = ordered.filter((r) => r.status === "open").length;
  const upcomingCount = ordered.filter((r) => r.status === "pending").length;
  const completedCount = ordered.filter((r) => r.status === "closed").length;
  const practiceCount = ordered.filter((r) => r.round_type === "practice").length;
  const competitiveCount = ordered.filter((r) => r.round_type === "competitive").length;

  const visible = useMemo(() => {
    const rows = ordered.filter((round) => {
      if (tab === "practice" && round.round_type !== "practice") return false;
      if (tab === "competitive" && round.round_type !== "competitive") return false;
      if (tab === "completed" && round.status !== "closed") return false;
      if (typeFilter !== "all" && round.round_type !== typeFilter) return false;
      if (statusFilter !== "all" && round.status !== statusFilter) return false;
      if (query) {
        const hay = `${typeLabel(round.round_type)} Round ${round.round_number} ${round.status}`;
        if (!hay.toLowerCase().includes(query.toLowerCase())) return false;
      }
      return true;
    });
    if (sortBy === "status") {
      const rank = { open: 0, pending: 1, closed: 2 } as Record<string, number>;
      return [...rows].sort(
        (a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9)
      );
    }
    if (sortBy === "type") {
      return [...rows].sort((a, b) =>
        a.round_type.localeCompare(b.round_type)
      );
    }
    return rows;
  }, [ordered, query, sortBy, statusFilter, tab, typeFilter]);

  async function updateRound(
    roundId: string,
    status: "open" | "closed",
    economy?: EconomyCondition
  ) {
    setLoadingId(roundId);
    await fetch(`/api/sessions/${sessionId}/rounds/${roundId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, economy_condition: economy }),
    });
    setLoadingId(null);
    window.location.reload();
  }

  /** Iteration 5 §7: "Deadline should populate from Round Management." */
  async function saveDeadline(roundId: string, value: string) {
    setLoadingId(roundId);
    await fetch(`/api/sessions/${sessionId}/rounds/${roundId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision_deadline: fromDateTimeLocal(value) }),
    });
    setLoadingId(null);
    window.location.reload();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link
          href="/sessions/new"
          className="rounded-md border border-[var(--portal-accent-blue)] px-3.5 py-2 text-sm font-semibold text-[var(--portal-accent-blue)]"
        >
          Start a new course
        </Link>
        <button
          type="button"
          onClick={() => setShowCreateNote((v) => !v)}
          className="rounded-md bg-[var(--portal-accent-blue)] px-3.5 py-2 text-sm font-semibold text-white"
        >
          + Create New Round
        </button>
      </div>
      {showCreateNote ? (
        <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
          <h3 className="text-sm font-bold text-[var(--portal-title)]">
            Create a new round
          </h3>
          <p className="mt-1 text-sm text-[var(--portal-muted)]">
            Adds the next pending round on this course. It stays closed until
            you open it. Completed rounds stay frozen.
          </p>
          <form
            className="mt-3 flex flex-wrap items-end gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              setCreating(true);
              setCreateError(null);
              const res = await fetch(`/api/sessions/${sessionId}/rounds`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ round_type: newType }),
              });
              const data = await res.json().catch(() => ({}));
              setCreating(false);
              if (!res.ok) {
                setCreateError(data.error ?? "Could not create the round.");
                return;
              }
              window.location.reload();
            }}
          >
            <label className="min-w-[10rem] text-sm">
              <span className="mb-1 block font-medium text-[var(--portal-ink)]">
                Round type
              </span>
              <select
                className={formSelectClassName}
                value={newType}
                onChange={(e) =>
                  setNewType(e.target.value as "practice" | "competitive")
                }
              >
                <option value="competitive">Competitive</option>
                <option value="practice">Practice</option>
              </select>
            </label>
            <Button type="submit" size="sm" disabled={creating}>
              {creating ? "Creating…" : "Add round"}
            </Button>
          </form>
          {createError ? (
            <p className="mt-2 text-sm text-[var(--portal-brand)]">
              {createError}
            </p>
          ) : null}
        </section>
      ) : null}

      <ProfessorTabBar
        active={tab}
        onChange={(id) =>
          setTab(id as "all" | "practice" | "competitive" | "completed")
        }
        tabs={[
          { id: "all", label: "All Rounds" },
          { id: "practice", label: "Practice Rounds" },
          { id: "competitive", label: "Competitive Rounds" },
          { id: "completed", label: "Completed Rounds" },
        ]}
      />

      <ProfessorMetricStrip
        tiles={[
          {
            label: "Total Rounds",
            value: String(ordered.length),
            hint: `${practiceCount} Practice · ${competitiveCount} Competitive`,
            icon: <LayoutGrid className="h-5 w-5" strokeWidth={1.75} />,
            iconWrap: "bg-[var(--portal-accent-blue-soft)] text-[var(--portal-accent-blue)]",
          },
          {
            label: "Open",
            value: String(openCount),
            hint: "Currently Active",
            icon: <Play className="h-5 w-5" strokeWidth={1.75} />,
            iconWrap: "bg-emerald-100 text-emerald-700",
          },
          {
            label: "Upcoming",
            value: String(upcomingCount),
            hint: "Scheduled",
            icon: <CalendarDays className="h-5 w-5" strokeWidth={1.75} />,
            iconWrap: "bg-amber-100 text-amber-700",
          },
          {
            label: "Completed",
            value: String(completedCount),
            hint: "Past Rounds",
            icon: <Check className="h-5 w-5" strokeWidth={2} />,
            iconWrap: "bg-violet-100 text-violet-700",
          },
        ]}
      />

      <ProfessorFilterBar
        search={query}
        onSearch={setQuery}
        searchPlaceholder="Search rounds..."
      >
        <select
          className={`${formSelectClassName} min-w-0`}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="practice">Practice</option>
          <option value="competitive">Competitive</option>
        </select>
        <select
          className={`${formSelectClassName} min-w-0`}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="pending">Upcoming</option>
          <option value="closed">Completed</option>
        </select>
        <select
          className={`${formSelectClassName} min-w-0`}
          value={sortBy}
          onChange={(e) =>
            setSortBy(e.target.value as "order" | "status" | "type")
          }
        >
          <option value="order">Sort: Round Order</option>
          <option value="status">Sort: Status</option>
          <option value="type">Sort: Type</option>
        </select>
      </ProfessorFilterBar>

      <section className="overflow-hidden rounded-xl border border-[var(--portal-sidebar-border)] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f8f9fb] text-[0.8125rem] font-semibold text-[var(--portal-muted)]">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">Round</th>
                <th className="px-4 py-3 whitespace-nowrap">Type</th>
                <th className="px-4 py-3 whitespace-nowrap">Status</th>
                <th className="px-4 py-3 whitespace-nowrap">Decision Window</th>
                <th className="px-4 py-3 whitespace-nowrap">Teams</th>
                <th className="px-4 py-3 whitespace-nowrap">Key Settings</th>
                <th className="px-4 py-3 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-[var(--portal-muted)]"
                  >
                    No rounds match these filters.
                  </td>
                </tr>
              ) : null}
              {visible.map((round) => {
                const window = windowCopy(round);
                const due = deadlineState(round.decision_deadline);
                return (
                  <tr
                    key={round.id}
                    className="border-t border-[var(--portal-sidebar-border)]"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <GripVertical
                          className="h-4 w-4 shrink-0 text-[#c9ced6]"
                          strokeWidth={2}
                          aria-hidden="true"
                        />
                        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--portal-accent-blue)] text-xs font-bold text-white">
                          {round.round_number}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-[var(--portal-title)]">
                            {typeLabel(round.round_type)} Round{" "}
                            {round.round_number}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-[0.6875rem] font-semibold ${typeClass(round.round_type)}`}
                      >
                        {typeLabel(round.round_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-[0.6875rem] font-semibold ${statusClass(round.status)}`}
                      >
                        {statusLabel(round.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[var(--portal-ink)]">{window.primary}</p>
                      <p className={`mt-0.5 text-[0.6875rem] ${window.secondaryClass}`}>
                        {window.secondary}
                      </p>
                      <p className="mt-2 text-[0.625rem] font-bold uppercase tracking-wide text-[var(--portal-muted)]">
                        Decisions due
                      </p>
                      {round.status === "closed" ? (
                        <p className="text-[0.6875rem] text-[var(--portal-ink)]">
                          {due.kind === "unset" ? "No deadline set" : due.label}
                        </p>
                      ) : (
                        <input
                          type="datetime-local"
                          className="mt-0.5 w-full rounded-md border border-[var(--portal-sidebar-border)] px-2 py-1 text-[0.6875rem] text-[var(--portal-ink)]"
                          defaultValue={toDateTimeLocal(round.decision_deadline)}
                          disabled={loadingId === round.id}
                          onChange={(e) =>
                            void saveDeadline(round.id, e.target.value)
                          }
                        />
                      )}
                      {due.kind !== "unset" ? (
                        <p
                          className={`mt-0.5 text-[0.6875rem] ${
                            due.kind === "passed"
                              ? "text-[var(--portal-brand)]"
                              : "text-emerald-700"
                          }`}
                        >
                          {due.remaining}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 tabular-nums font-medium text-[var(--portal-ink)]">
                      {teamCount || "—"}
                    </td>
                    <td className="px-4 py-3 text-[var(--portal-muted)]">
                      <p>7 Decisions</p>
                      <p>Budget: {formatCurrency(DISCRETIONARY_BUDGET)}</p>
                      {round.status === "open" ? (
                        <select
                          className={`mt-1 ${formSelectClassName}`}
                          defaultValue={round.economy_condition}
                          disabled={loadingId === round.id}
                          onChange={(e) =>
                            updateRound(
                              round.id,
                              "open",
                              e.target.value as EconomyCondition
                            )
                          }
                        >
                          <option value="boom">Boom</option>
                          <option value="normal">Normal</option>
                          <option value="recession">Recession</option>
                        </select>
                      ) : (
                        <p>{economyLabel(round.economy_condition)}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {round.status === "pending" ? (
                          <Button
                            size="sm"
                            disabled={loadingId === round.id || openCount > 0}
                            onClick={() => updateRound(round.id, "open")}
                          >
                            Open round
                          </Button>
                        ) : null}
                        {round.status === "open" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={loadingId === round.id}
                            onClick={() => updateRound(round.id, "closed")}
                          >
                            Close & process
                          </Button>
                        ) : null}
                        {round.status === "closed" ? (
                          <Link
                            href={`/sessions/${sessionId}/reports`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--portal-accent-blue)] hover:underline"
                          >
                            <BarChart3 className="h-3.5 w-3.5" />
                            View Results
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="border-t border-[var(--portal-sidebar-border)] px-4 py-3 text-xs text-[var(--portal-muted)]">
          Rounds are created with the course session. Visual order matches
          engine processing order. Closing a round processes results through
          the existing engine — this page does not score independently.
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section
          id="decision-areas"
          className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm"
        >
          <h2 className="text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--portal-title)]">
            Decision Areas
          </h2>
          <p className="mt-1 text-sm text-[var(--portal-muted)]">
            The seven HR modules students complete each open round. Same
            definition as the student portal and engine.
          </p>
          <ol className="mt-3 space-y-1.5 text-sm text-[var(--portal-ink)]">
            {DECISION_TABS.map((tab) => (
              <li key={tab.key}>
                <span className="font-semibold">{tab.index + 1}.</span>{" "}
                {tab.label}
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
          <h2 className="text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--portal-title)]">
            Scoring & Feedback
          </h2>
          <p className="mt-1 text-sm text-[var(--portal-muted)]">
            Formulas, benchmarks, and diagnostics live in Simulation Lab. Round
            Management only opens, closes, and processes.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/sessions/config"
              className="rounded-md border border-[var(--portal-accent-blue)] px-3 py-2 text-xs font-semibold text-[var(--portal-accent-blue)] hover:bg-[var(--portal-accent-blue-soft)]"
            >
              Open Configuration
            </Link>
            <Link
              href={`/sessions/${sessionId}/inspect`}
              className="rounded-md border border-[var(--portal-sidebar-border)] px-3 py-2 text-xs font-semibold text-[var(--portal-ink)] hover:bg-[#f8f9fb]"
            >
              Formula Inspect
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
