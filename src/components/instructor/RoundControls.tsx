"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formSelectClassName } from "@/components/ui/form-controls";
import type { EconomyCondition } from "@/lib/engine/types";

interface Round {
  id: string;
  round_number: number;
  round_type: string;
  status: string;
  economy_condition: EconomyCondition;
}

interface RoundControlsProps {
  sessionId: string;
  rounds: Round[];
}

export function RoundControls({ sessionId, rounds }: RoundControlsProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

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

  return (
    <div className="space-y-3">
      {rounds
        .sort((a, b) => a.round_number - b.round_number)
        .map((round) => (
          <div
            key={round.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--portal-sidebar-border)] bg-white p-4"
          >
            <div>
              <p className="font-medium text-[var(--portal-title)]">
                Round {round.round_number}{" "}
                <span className="text-[var(--portal-muted)]">({round.round_type})</span>
              </p>
              <p className="text-sm text-[var(--portal-muted)]">
                Status: <span className="capitalize">{round.status}</span>
                {" · "}
                Economy: {round.economy_condition}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {round.status !== "open" && round.status !== "closed" && (
                <Button
                  size="sm"
                  disabled={loadingId === round.id}
                  onClick={() => updateRound(round.id, "open")}
                >
                  Open round
                </Button>
              )}
              {round.status === "open" && (
                <>
                  <select
                    className={formSelectClassName}
                    defaultValue={round.economy_condition}
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
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={loadingId === round.id}
                    onClick={() => updateRound(round.id, "closed")}
                  >
                    Close & compute
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
    </div>
  );
}
