"use client";

import {
  WorkforceBriefView,
  type WorkforceBriefData,
} from "@/components/results/WorkforceBriefView";
import { generateTeamPdf, outcomeToPdfData } from "@/lib/export/pdf";

export function WorkforceBriefClient({
  data,
  teamId,
  roundId,
  sessionName,
  team,
  outcome,
}: {
  data: Partial<WorkforceBriefData>;
  teamId?: string;
  roundId?: string;
  sessionName?: string;
  team?: { name: string; industry: string; strategy: string };
  outcome?: Record<string, unknown> | null;
}) {
  async function handleSaveReflection(content: string) {
    if (!teamId || !roundId) {
      throw new Error("Missing team or round");
    }
    const res = await fetch("/api/reflections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        team_id: teamId,
        round_id: roundId,
        content,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "Failed to submit reflection");
    }
    window.location.reload();
  }

  function handleDownloadPdf() {
    if (!outcome || !team || !sessionName) return;
    const pdf = outcomeToPdfData(
      sessionName,
      team,
      data.roundNumber ?? 1,
      outcome
    );
    if (data.reflectionContent) {
      pdf.reflection = data.reflectionContent;
    }
    generateTeamPdf(pdf);
  }

  return (
    <WorkforceBriefView
      data={{
        ...data,
        onSaveReflection:
          teamId && roundId ? handleSaveReflection : undefined,
        onDownloadPdf:
          outcome && team && sessionName ? handleDownloadPdf : undefined,
      }}
    />
  );
}
