"use client";

import { useEffect, useState } from "react";

interface CoachMessageRow {
  id: string;
  role: "user" | "assistant";
  content: string;
  input_tokens: number | null;
  output_tokens: number | null;
  created_at: string;
  profiles?: { display_name: string } | null;
}

interface TranscriptResponse {
  team: { id: string; name: string };
  messages: CoachMessageRow[];
  usage: { totalInputTokens: number; totalOutputTokens: number };
}

/**
 * Instructor-facing view of a team's AI coach transcript, backed by
 * GET /api/coach/transcripts. Instructors grade these students on the
 * decisions the coach was consulted about, so every exchange is visible
 * here along with the token spend it cost.
 */
export function CoachTranscriptPanel({ teamId }: { teamId: string }) {
  // Tagged with the teamId it describes, mirroring the pattern in
  // InspectPage, so a slow response for a previously selected team can
  // never render against the currently selected one.
  const [result, setResult] = useState<{
    key: string;
    data: TranscriptResponse | null;
    error: string | null;
  } | null>(null);

  const current = result?.key === teamId ? result : null;
  const data = current?.data ?? null;
  const error = current?.error ?? null;
  const loading = Boolean(teamId) && current === null;

  useEffect(() => {
    if (!teamId) return;
    const controller = new AbortController();
    void (async () => {
      try {
        const res = await fetch(`/api/coach/transcripts?team_id=${teamId}`, {
          signal: controller.signal,
        });
        const body = await res.json();
        if (controller.signal.aborted) return;
        setResult(
          res.ok
            ? { key: teamId, data: body, error: null }
            : { key: teamId, data: null, error: body.error ?? "Could not load transcript" }
        );
      } catch {
        if (controller.signal.aborted) return;
        setResult({ key: teamId, data: null, error: "Could not load transcript" });
      }
    })();
    return () => controller.abort();
  }, [teamId]);

  if (!teamId) return null;

  return (
    <section className="mt-6 rounded-xl border border-[var(--portal-sidebar-border)] bg-[var(--portal-page)] p-5">
      <h3 className="font-semibold text-[var(--portal-title)]">AI Coach transcript</h3>
      {loading && <p className="mt-2 text-sm text-[var(--portal-muted)]">Loading…</p>}
      {error && (
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {error}
        </p>
      )}
      {data && (
        <>
          <p className="mt-1 text-sm text-[var(--portal-muted)]">
            {data.messages.length} messages · {data.usage.totalInputTokens} input /{" "}
            {data.usage.totalOutputTokens} output tokens
          </p>
          <div className="mt-3 max-h-96 space-y-2 overflow-y-auto rounded-lg border border-[var(--portal-sidebar-border)] bg-white p-3">
            {data.messages.length === 0 && (
              <p className="text-sm text-[var(--portal-muted)]">
                No coach exchanges yet for this team.
              </p>
            )}
            {data.messages.map((m) => (
              <div key={m.id} className="text-sm">
                <span className="font-medium text-[var(--portal-ink)]">
                  {m.role === "user" ? m.profiles?.display_name ?? "Student" : "Coach"}:
                </span>{" "}
                <span className="text-[var(--portal-ink)]">{m.content}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
