"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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

export function CreateTeamForm({ sessionId }: { sessionId: string }) {
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState<Industry>("Manufacturing");
  const [strategy, setStrategy] = useState<Strategy>("Focus");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch(`/api/sessions/${sessionId}/teams`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, industry, strategy }),
    });
    setLoading(false);
    setName("");
    window.location.reload();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4"
    >
      <label className="text-sm">
        <span className="font-medium">Team name</span>
        <input
          required
          className="mt-1 block rounded-lg border border-slate-300 px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label className="text-sm">
        <span className="font-medium">Industry</span>
        <select
          className="mt-1 block rounded-lg border border-slate-300 px-3 py-2"
          value={industry}
          onChange={(e) => setIndustry(e.target.value as Industry)}
        >
          {INDUSTRIES.map((i) => (
            <option key={i}>{i}</option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        <span className="font-medium">Strategy</span>
        <select
          className="mt-1 block rounded-lg border border-slate-300 px-3 py-2"
          value={strategy}
          onChange={(e) => setStrategy(e.target.value as Strategy)}
        >
          {STRATEGIES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <Button type="submit" size="sm" disabled={loading}>
        Add team
      </Button>
    </form>
  );
}
