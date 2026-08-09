"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { DecisionForm } from "@/components/decisions/DecisionForm";
import { rowToDecision } from "@/lib/db/decisions";
import { createDefaultDecision } from "@/lib/engine/defaults";
import { markModuleVisited } from "@/lib/student/module-progress";
import type {
  Decision,
  EconomyCondition,
  Industry,
  Strategy,
} from "@/lib/engine/types";
import { Button } from "@/components/ui/button";

const TAB_KEYS = [
  "recruitment",
  "performance",
  "training",
  "relations",
  "compensation",
  "org-design",
  "dei",
] as const;

interface DecisionWorkspaceProps {
  teamId: string;
  roundId: string;
  industry: Industry;
  strategy: Strategy;
  economy: EconomyCondition;
  initialDecision?: Record<string, unknown> | null;
  roundOpen: boolean;
  roundNumber?: number;
}

export function DecisionWorkspace(props: DecisionWorkspaceProps) {
  return (
    <Suspense
      fallback={
        <p className="p-4 text-sm text-[var(--portal-muted)]">Loading decisions…</p>
      }
    >
      <DecisionWorkspaceInner {...props} />
    </Suspense>
  );
}

function DecisionWorkspaceInner({
  teamId,
  roundId,
  industry,
  strategy,
  economy,
  initialDecision,
  roundOpen,
  roundNumber,
}: DecisionWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
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
      if (!roundOpen) return false;
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
        return false;
      }
      const data = await res.json();
      setDecision(data.decision);
      if (submit) {
        setSubmitted(true);
        toast.success("Decision submitted");
      }
      return true;
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

  async function saveAndContinue() {
    const tab = searchParams.get("tab") ?? "recruitment";
    const idx = TAB_KEYS.indexOf(tab as (typeof TAB_KEYS)[number]);
    const current = idx >= 0 ? TAB_KEYS[idx] : "recruitment";
    markModuleVisited(roundId, current);
    const ok = await save(false);
    if (!ok) return;
    if (idx < 0 || idx >= TAB_KEYS.length - 1) {
      router.push(`/round/${roundId}/review`);
      return;
    }
    const next = TAB_KEYS[idx + 1];
    router.push(`/round/${roundId}/decisions?tab=${next}`);
  }

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
    <DecisionForm
      industry={industry}
      strategy={strategy}
      economy={economy}
      controlledDecision={decision}
      onDecisionChange={setDecision}
      hideRunButton
      roundNumber={roundNumber}
      roundOpen={roundOpen}
      roundId={roundId}
      saving={saving}
      onSaveNow={() => void save(false)}
      onSaveAndContinue={() => void saveAndContinue()}
    />
  );
}
