"use client";

import { useState } from "react";
import { DecisionForm } from "@/components/decisions/DecisionForm";
import { formSelectClassName } from "@/components/ui/form-controls";
import { useSimulationConfig } from "@/hooks/useSimulationConfig";
import type { EconomyCondition, Industry, Strategy } from "@/lib/engine/types";

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

const ECONOMIES: EconomyCondition[] = ["boom", "normal", "recession"];

export default function SimulatePage() {
  useSimulationConfig();
  const [industry, setIndustry] = useState<Industry>("High-Tech");
  const [strategy, setStrategy] = useState<Strategy>("Innovation");
  const [economy, setEconomy] = useState<EconomyCondition>("normal");

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl px-4 py-6 sm:py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Practice round — decision simulator
        </h1>
        <p className="mt-2 text-slate-600">
          Configure your team&apos;s industry and strategy, make HR decisions
          across seven modules, and run the simulation engine locally. Connect
          Supabase to persist teams, rounds, and class sessions.
        </p>
      </div>

      <div className="mb-8 grid gap-4 rounded-xl border border-slate-200 bg-white p-4 grid-cols-1 sm:grid-cols-3">
        <label className="text-sm">
          <span className="font-medium text-slate-700">Industry</span>
          <select
            className={`mt-1 ${formSelectClassName}`}
            value={industry}
            onChange={(e) => setIndustry(e.target.value as Industry)}
          >
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="font-medium text-slate-700">Strategy</span>
          <select
            className={`mt-1 ${formSelectClassName}`}
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as Strategy)}
          >
            {STRATEGIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="font-medium text-slate-700">Economy</span>
          <select
            className={`mt-1 ${formSelectClassName}`}
            value={economy}
            onChange={(e) => setEconomy(e.target.value as EconomyCondition)}
          >
            {ECONOMIES.map((e) => (
              <option key={e} value={e}>
                {e.charAt(0).toUpperCase() + e.slice(1)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <DecisionForm industry={industry} strategy={strategy} economy={economy} />
    </div>
  );
}
