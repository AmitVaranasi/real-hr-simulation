"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { generateClassExcel, type ClassExportData } from "@/lib/export/excel";
import { generateTeamPdf, outcomeToPdfData } from "@/lib/export/pdf";
import { ScoreOverrideDialog } from "@/components/instructor/ScoreOverrideDialog";
import { formSelectClassName } from "@/components/ui/form-controls";

interface ReportsData {
  session: { id: string; name: string };
  teams: Array<{
    id: string;
    name: string;
    industry: string;
    strategy: string;
  }>;
  rounds: Array<{ id: string; round_number: number; round_type: string }>;
  outcomes: Array<Record<string, unknown>>;
  decisions: Array<Record<string, unknown>>;
  reflections: Array<Record<string, unknown>>;
}

export function ReportsClient({ sessionId }: { sessionId: string }) {
  const [data, setData] = useState<ReportsData | null>(null);
  const [tab, setTab] = useState<
    "comparison" | "participation" | "decisions" | "export"
  >("comparison");
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [selectedRound, setSelectedRound] = useState<string>("");

  useEffect(() => {
    fetch(`/api/sessions/${sessionId}/reports`)
      .then((r) => r.json())
      .then(setData);
  }, [sessionId]);

  if (!data) {
    return <p className="text-slate-500">Loading reports…</p>;
  }

  const exportData: ClassExportData = {
    sessionName: data.session.name,
    teams: data.teams.map((t) => ({
      id: t.id,
      name: t.name,
      industry: t.industry,
      strategy: t.strategy,
    })),
    rounds: data.rounds,
    outcomes: data.outcomes,
    decisions: data.decisions,
    reflections: data.reflections,
  };

  const tabs = [
    { id: "comparison" as const, label: "Comparison" },
    { id: "participation" as const, label: "Participation" },
    { id: "decisions" as const, label: "Decisions" },
    { id: "export" as const, label: "Export" },
  ];

  return (
    <div>
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              tab === t.id
                ? "bg-indigo-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "comparison" && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left">Team</th>
                {data.rounds.map((r) => (
                  <th key={r.id} className="px-3 py-2">
                    R{r.round_number}
                  </th>
                ))}
                <th className="px-3 py-2">Avg (competitive)</th>
                <th className="px-3 py-2">Override</th>
                <th className="px-3 py-2">Inspect</th>
              </tr>
            </thead>
            <tbody>
              {data.teams.map((team) => {
                const teamOutcomes = data.outcomes.filter(
                  (o) => o.team_id === team.id
                );
                const competitive = teamOutcomes.filter((o) => {
                  const r = data.rounds.find((rd) => rd.id === o.round_id);
                  return r?.round_type === "competitive";
                });
                const avg =
                  competitive.length > 0
                    ? competitive.reduce(
                        (s, o) =>
                          s +
                          Number(o.instructor_override ?? o.total_score),
                        0
                      ) / competitive.length
                    : null;
                return (
                  <tr key={team.id} className="border-t">
                    <td className="px-3 py-2 font-medium">{team.name}</td>
                    {data.rounds.map((r) => {
                      const o = teamOutcomes.find((x) => x.round_id === r.id);
                      return (
                        <td key={r.id} className="px-3 py-2 text-center">
                          {o
                            ? Number(
                                o.instructor_override ?? o.total_score
                              ).toFixed(1)
                            : "—"}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-center font-semibold">
                      {avg?.toFixed(1) ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      <select
                        className={`text-xs ${formSelectClassName}`}
                        onChange={(e) => {
                          setSelectedTeam(team.id);
                          setSelectedRound(e.target.value);
                        }}
                        defaultValue=""
                      >
                        <option value="">Round…</option>
                        {data.rounds
                          .filter((r) =>
                            teamOutcomes.some((o) => o.round_id === r.id)
                          )
                          .map((r) => (
                            <option key={r.id} value={r.id}>
                              R{r.round_number}
                            </option>
                          ))}
                      </select>
                      {selectedTeam === team.id && selectedRound && (
                        <ScoreOverrideDialog
                          teamId={team.id}
                          roundId={selectedRound}
                          currentScore={
                            Number(
                              teamOutcomes.find(
                                (o) => o.round_id === selectedRound
                              )?.total_score
                            ) || 0
                          }
                        />
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {teamOutcomes.length > 0 && (
                        <a
                          href={`/sessions/${sessionId}/inspect?team=${team.id}&round=${teamOutcomes[teamOutcomes.length - 1]!.round_id}`}
                          className="text-xs text-indigo-600 hover:underline"
                        >
                          Latest
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === "participation" && (
        <table className="mt-6 w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left">Team</th>
              <th className="px-3 py-2">Round</th>
              <th className="px-3 py-2">Decision submitted</th>
              <th className="px-3 py-2">Reflection</th>
            </tr>
          </thead>
          <tbody>
            {data.teams.flatMap((team) =>
              data.rounds.map((round) => {
                const dec = data.decisions.find(
                  (d) => d.team_id === team.id && d.round_id === round.id
                );
                const ref = data.reflections.find(
                  (r) => r.team_id === team.id && r.round_id === round.id
                );
                return (
                  <tr key={`${team.id}-${round.id}`} className="border-t">
                    <td className="px-3 py-2">{team.name}</td>
                    <td className="px-3 py-2">R{round.round_number}</td>
                    <td className="px-3 py-2">
                      {dec?.is_submitted ? "Yes" : "No"}
                      {dec?.submitted_at
                        ? ` (${new Date(String(dec.submitted_at)).toLocaleDateString()})`
                        : ""}
                    </td>
                    <td className="px-3 py-2">{ref ? "Yes" : "No"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      )}

      {tab === "decisions" && (
        <div className="mt-6 space-y-4">
          <select
            className={formSelectClassName}
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
          >
            <option value="">Select team…</option>
            {data.teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          {selectedTeam && (
            <pre className="overflow-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">
              {JSON.stringify(
                data.decisions.filter((d) => d.team_id === selectedTeam),
                null,
                2
              )}
            </pre>
          )}
        </div>
      )}

      {tab === "export" && (
        <div className="mt-6 space-y-4">
          <Button onClick={() => generateClassExcel(exportData)}>
            Download Excel (full class)
          </Button>
          <div className="flex flex-wrap gap-2">
            {data.teams.map((team) => {
              const lastOutcome = data.outcomes
                .filter((o) => o.team_id === team.id)
                .pop();
              if (!lastOutcome) return null;
              const round = data.rounds.find(
                (r) => r.id === lastOutcome.round_id
              );
              return (
                <Button
                  key={team.id}
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    generateTeamPdf(
                      outcomeToPdfData(
                        data.session.name,
                        team,
                        round?.round_number ?? 0,
                        lastOutcome
                      )
                    )
                  }
                >
                  PDF: {team.name}
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
