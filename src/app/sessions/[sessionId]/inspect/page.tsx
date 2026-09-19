"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  FormulaInspector,
  type CarryForwardInfo,
} from "@/components/instructor/FormulaInspector";
import { CoachTranscriptPanel } from "@/components/instructor/CoachTranscriptPanel";
import { formSelectClassName } from "@/components/ui/form-controls";
import type { Decision, SimulationTrace } from "@/lib/engine/types";

type TeamOption = { id: string; name: string };
type RoundOption = { id: string; round_number: number; round_type: string };

export default function InspectPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const searchParams = useSearchParams();
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [rounds, setRounds] = useState<RoundOption[]>([]);
  const [teamId, setTeamId] = useState(searchParams.get("team") ?? "");
  const [roundId, setRoundId] = useState(searchParams.get("round") ?? "");
  type TracePayload = {
    team: { name: string };
    round: { round_number: number; round_type: string };
    decision: Decision | null;
    trace: SimulationTrace;
    carryForward?: CarryForwardInfo | null;
  };
  /**
   * Tagged with the team+round it describes, so a slow response for a
   * previous selection can never render against the current one.
   */
  const [result, setResult] = useState<{
    key: string;
    payload: TracePayload | null;
    error: string | null;
  } | null>(null);

  const selectionKey = teamId && roundId ? `${teamId}:${roundId}` : "";
  const current = selectionKey && result?.key === selectionKey ? result : null;
  const payload = current?.payload ?? null;
  const error = current?.error ?? null;
  const loading = Boolean(selectionKey) && current === null;

  useEffect(() => {
    async function loadMeta() {
      const res = await fetch(`/api/sessions/${sessionId}`);
      if (!res.ok) return;
      const data = await res.json();
      const session = data.session ?? data;
      setTeams(
        (session.teams ?? []).map((t: { id: string; name: string }) => ({
          id: t.id,
          name: t.name,
        }))
      );
      setRounds(
        (session.rounds ?? []).map(
          (r: { id: string; round_number: number; round_type: string }) => ({
            id: r.id,
            round_number: r.round_number,
            round_type: r.round_type,
          })
        )
      );
    }
    void loadMeta();
  }, [sessionId]);

  useEffect(() => {
    if (!selectionKey) return;

    const controller = new AbortController();

    void (async () => {
      try {
        const res = await fetch(
          `/api/sessions/${sessionId}/inspect/${teamId}/${roundId}`,
          { signal: controller.signal }
        );
        const data = await res.json();
        if (controller.signal.aborted) return;
        setResult(
          res.ok
            ? { key: selectionKey, payload: data, error: null }
            : {
                key: selectionKey,
                payload: null,
                error: data.error ?? "Could not load trace",
              }
        );
      } catch {
        if (controller.signal.aborted) return;
        setResult({
          key: selectionKey,
          payload: null,
          error: "Could not load trace",
        });
      }
    })();

    return () => controller.abort();
  }, [sessionId, teamId, roundId, selectionKey]);

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl px-4 py-10">
      <Link
        href={`/sessions/${sessionId}`}
        className="text-sm text-[var(--portal-primary)] hover:underline"
      >
        ← Back to session
      </Link>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end">
        <label className="flex-1 text-sm">
          <span className="font-medium text-[var(--portal-ink)]">Team</span>
          <select
            className={`mt-1 w-full ${formSelectClassName}`}
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
          >
            <option value="">Select team…</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex-1 text-sm">
          <span className="font-medium text-[var(--portal-ink)]">Round</span>
          <select
            className={`mt-1 w-full ${formSelectClassName}`}
            value={roundId}
            onChange={(e) => setRoundId(e.target.value)}
          >
            <option value="">Select round…</option>
            {rounds.map((r) => (
              <option key={r.id} value={r.id}>
                Round {r.round_number} ({r.round_type})
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && <p className="text-sm text-[var(--portal-muted)]">Loading trace…</p>}
      {error && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {error}
        </p>
      )}

      {payload && (
        <FormulaInspector
          teamName={payload.team.name}
          roundLabel={`Round ${payload.round.round_number} (${payload.round.round_type})`}
          decision={payload.decision}
          trace={payload.trace}
          carryForward={payload.carryForward}
        />
      )}

      {teamId && <CoachTranscriptPanel teamId={teamId} />}
    </div>
  );
}
