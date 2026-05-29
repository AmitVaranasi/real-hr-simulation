"use client";

import { useState } from "react";
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
      className="mt-4 grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end"
    >
      <label className="flex min-w-0 flex-col text-sm sm:col-span-2 lg:col-span-1">
        <span className="font-medium text-slate-700">Team name</span>
        <input
          required
          className={`mt-1 ${formInputClassName}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label className="flex min-w-0 flex-col text-sm">
        <span className="font-medium text-slate-700">Industry</span>
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
        <span className="font-medium text-slate-700">Strategy</span>
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
      <Button
        type="submit"
        size="sm"
        disabled={loading}
        className="w-full sm:col-span-2 lg:col-span-1 lg:w-auto"
      >
        Add team
      </Button>
    </form>
  );
}
