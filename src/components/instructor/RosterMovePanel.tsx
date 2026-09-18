"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formSelectClassName } from "@/components/ui/form-controls";

export type RosterStudent = { id: string; name: string };
export type RosterTeam = { id: string; name: string; members: RosterStudent[] };

/**
 * future-fixes.md "Instructor-initiated removal of a student": move a
 * student between teams in this session, including after either team has
 * submitted decisions — the case the student-facing Leave Team card
 * refuses. Hits POST /api/sessions/[sessionId]/roster.
 */
export function RosterMovePanel({
  sessionId,
  teams,
}: {
  sessionId: string;
  teams: RosterTeam[];
}) {
  const router = useRouter();
  const allStudents = useMemo(
    () =>
      teams.flatMap((team) =>
        team.members.map((m) => ({ ...m, teamId: team.id, teamName: team.name }))
      ),
    [teams]
  );

  const [studentId, setStudentId] = useState("");
  const [toTeamId, setToTeamId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedStudent = allStudents.find((s) => s.id === studentId) ?? null;
  const destinationOptions = teams.filter((t) => t.id !== selectedStudent?.teamId);

  async function handleMove(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudent || !toTeamId) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    const res = await fetch(`/api/sessions/${sessionId}/roster`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: selectedStudent.id,
        fromTeamId: selectedStudent.teamId,
        toTeamId,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to move student");
      return;
    }

    const destination = teams.find((t) => t.id === toTeamId);
    setSuccess(
      `Moved ${selectedStudent.name} to ${destination?.name ?? "the new team"}.`
    );
    setStudentId("");
    setToTeamId("");
    router.refresh();
  }

  if (allStudents.length === 0) {
    return (
      <p className="text-sm text-[var(--portal-muted)]">
        No students enrolled yet — there is no roster to manage.
      </p>
    );
  }

  return (
    <form
      onSubmit={handleMove}
      className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end"
    >
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 sm:col-span-3">
          {error}
        </p>
      )}
      {success && !error && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 sm:col-span-3">
          {success}
        </p>
      )}
      <label className="flex min-w-0 flex-col text-sm">
        <span className="font-medium text-[var(--portal-ink)]">Student</span>
        <select
          className={`mt-1 ${formSelectClassName}`}
          value={studentId}
          onChange={(e) => {
            setStudentId(e.target.value);
            setToTeamId("");
          }}
        >
          <option value="">Select a student…</option>
          {allStudents.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.teamName})
            </option>
          ))}
        </select>
      </label>
      <label className="flex min-w-0 flex-col text-sm">
        <span className="font-medium text-[var(--portal-ink)]">Move to</span>
        <select
          className={`mt-1 ${formSelectClassName}`}
          value={toTeamId}
          onChange={(e) => setToTeamId(e.target.value)}
          disabled={!selectedStudent}
        >
          <option value="">Select a team…</option>
          {destinationOptions.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
      <Button
        type="submit"
        size="sm"
        disabled={loading || !selectedStudent || !toTeamId}
      >
        {loading ? "Moving…" : "Move student"}
      </Button>
    </form>
  );
}
