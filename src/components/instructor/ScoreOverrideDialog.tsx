"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ScoreOverrideDialog({
  teamId,
  roundId,
  currentScore,
}: {
  teamId: string;
  roundId: string;
  currentScore: number;
}) {
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState(currentScore);
  const [reason, setReason] = useState("");

  async function submit() {
    const res = await fetch("/api/override", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        team_id: teamId,
        round_id: roundId,
        override_score: score,
        reason,
      }),
    });
    if (!res.ok) {
      toast.error("Override failed");
      return;
    }
    toast.success("Score updated");
    setOpen(false);
    window.location.reload();
  }

  if (!open) {
    return (
      <Button size="sm" variant="ghost" className="ml-1" onClick={() => setOpen(true)}>
        Override
      </Button>
    );
  }

  return (
    <div className="mt-2 flex flex-wrap items-end gap-2 rounded border bg-white p-2">
      <input
        type="number"
        className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 [color-scheme:light]"
        value={score}
        onChange={(e) => setScore(Number(e.target.value))}
      />
      <input
        className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 [color-scheme:light]"
        placeholder="Reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <Button size="sm" onClick={submit}>
        Save
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
        Cancel
      </Button>
    </div>
  );
}
