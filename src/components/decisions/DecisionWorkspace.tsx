"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { DecisionForm } from "@/components/decisions/DecisionForm";
import { rowToDecision } from "@/lib/db/decisions";
import { createDefaultDecision } from "@/lib/engine/defaults";
import type {
  Decision,
  EconomyCondition,
  Industry,
  Strategy,
} from "@/lib/engine/types";
import { Button } from "@/components/ui/button";

interface DecisionWorkspaceProps {
  teamId: string;
  roundId: string;
  industry: Industry;
  strategy: Strategy;
  economy: EconomyCondition;
  initialDecision?: Record<string, unknown> | null;
  roundOpen: boolean;
}

export function DecisionWorkspace({
  teamId,
  roundId,
  industry,
  strategy,
  economy,
  initialDecision,
  roundOpen,
}: DecisionWorkspaceProps) {
  const [decision, setDecision] = useState<Decision>(() =>
    initialDecision
      ? rowToDecision(initialDecision)
      : createDefaultDecision()
  );
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(
    Boolean(initialDecision?.is_submitted)
  );

  const save = useCallback(
    async (submit = false) => {
      if (!roundOpen) return;
      setSaving(true);
      const res = await fetch("/api/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...decision,
          team_id: teamId,
          round_id: roundId,
          is_submitted: submit,
        }),
      });
      setSaving(false);
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Failed to save");
        return;
      }
      const data = await res.json();
      setDecision(data.decision);
      if (submit) {
        setSubmitted(true);
        toast.success("Decision submitted");
      } else {
        toast.success("Saved", { duration: 1500 });
      }
    },
    [decision, teamId, roundId, roundOpen]
  );

  useEffect(() => {
    if (!roundOpen || submitted) return;
    const t = setTimeout(() => {
      void (async () => {
        setSaving(true);
        await fetch("/api/decisions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...decision,
            team_id: teamId,
            round_id: roundId,
            is_submitted: false,
          }),
        });
        setSaving(false);
      })();
    }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounced save on field changes
  }, [decision, roundOpen, submitted, teamId, roundId]);

  if (!roundOpen) {
    return (
      <p className="rounded-lg bg-amber-50 px-4 py-3 text-amber-900">
        This round is not open for decisions.
      </p>
    );
  }

  if (submitted) {
    return (
      <div className="space-y-4">
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-emerald-800">
          Your team has submitted decisions for this round.
        </p>
        <a href={`/round/${roundId}/results`}>
          <Button variant="outline">View results (when available)</Button>
        </a>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        {saving ? "Saving…" : "Changes auto-save"}
      </p>
      <DecisionForm
        industry={industry}
        strategy={strategy}
        economy={economy}
        controlledDecision={decision}
        onDecisionChange={setDecision}
        hideRunButton
      />
      <div className="mt-6 flex flex-wrap gap-3">
        <a href={`/round/${roundId}/review`}>
          <Button variant="outline">Review & submit →</Button>
        </a>
        <Button onClick={() => save(true)}>Quick submit</Button>
        <Button variant="outline" onClick={() => save(false)}>
          Save now
        </Button>
      </div>
    </div>
  );
}
