"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  formInputClassName,
  formSelectClassName,
} from "@/components/ui/form-controls";
import type { Industry, Strategy } from "@/lib/engine/types";

const INDUSTRIES: Industry[] = [
  "Manufacturing",
  "Service",
  "High-Tech",
  "Banking",
  "Retail",
];

const STRATEGIES: Strategy[] = [
  "Cost Leadership",
  "Differentiation",
  "Innovation",
  "Customer Intimacy",
  "Focus",
];

type Team = {
  id: string;
  name: string;
  industry: Industry;
  strategy: Strategy;
  join_code: string;
};

export function EditTeamForm({
  sessionId,
  team,
}: {
  sessionId: string;
  team: Team;
}) {
  const router = useRouter();
  const [name, setName] = useState(team.name);
  const [industry, setIndustry] = useState<Industry>(team.industry);
  const [strategy, setStrategy] = useState<Strategy>(team.strategy);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);
    const res = await fetch(`/api/sessions/${sessionId}/teams`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamId: team.id,
        name,
        industry,
        strategy,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to update team");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 grid grid-cols-1 gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end"
    >
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 sm:col-span-2 lg:col-span-4">
          {error}
        </p>
      )}
      <label className="flex min-w-0 flex-col text-sm sm:col-span-2 lg:col-span-1">
        <span className="font-medium text-[var(--portal-ink)]">Team name</span>
        <input
          required
          className={`mt-1 ${formInputClassName}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label className="flex min-w-0 flex-col text-sm">
        <span className="font-medium text-[var(--portal-ink)]">Industry</span>
        <select
          className={`mt-1 ${formSelectClassName}`}
          value={industry}
          onChange={(e) => setIndustry(e.target.value as Industry)}
        >
          {INDUSTRIES.map((i) => (
            <option key={i}>{i}</option>
          ))}
        </select>
      </label>
      <label className="flex min-w-0 flex-col text-sm">
        <span className="font-medium text-[var(--portal-ink)]">Strategy</span>
        <select
          className={`mt-1 ${formSelectClassName}`}
          value={strategy}
          onChange={(e) => setStrategy(e.target.value as Strategy)}
        >
          {STRATEGIES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-1">
        <Button type="submit" size="sm" disabled={loading} className="w-full">
          {loading ? "Saving…" : saved ? "Saved" : "Update team"}
        </Button>
      </div>
    </form>
  );
}
