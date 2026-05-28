"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Round {
  id: string;
  round_number: number;
  status: string;
  leaderboard_released: boolean;
}

export function LeaderboardRelease({
  sessionId,
  rounds,
}: {
  sessionId: string;
  rounds: Round[];
}) {
  const [loading, setLoading] = useState<string | null>(null);

  async function toggle(roundId: string, released: boolean) {
    setLoading(roundId);
    await fetch(
      `/api/sessions/${sessionId}/rounds/${roundId}/leaderboard`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ released }),
      }
    );
    setLoading(null);
    window.location.reload();
  }

  const closed = rounds.filter((r) => r.status === "closed");

  if (closed.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Close a round to release its leaderboard.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {closed.map((r) => (
        <li
          key={r.id}
          className="flex items-center justify-between rounded-lg border bg-white px-4 py-3"
        >
          <span>
            Round {r.round_number}
            {r.leaderboard_released && (
              <span className="ml-2 text-xs text-emerald-600">Released</span>
            )}
          </span>
          <Button
            size="sm"
            variant={r.leaderboard_released ? "outline" : "default"}
            disabled={loading === r.id}
            onClick={() => toggle(r.id, !r.leaderboard_released)}
          >
            {r.leaderboard_released ? "Hide" : "Release"} leaderboard
          </Button>
        </li>
      ))}
    </ul>
  );
}
