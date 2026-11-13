"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  Lightbulb,
  Minus,
  Plus,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

/**
 * A miniature, working copy of the HR decision page for the orientation.
 *
 * It mirrors the real page's regions (status chips, budget bar, decision
 * inputs, impact preview, guidance, save bar) with example numbers, so a
 * student can change an input and watch the budget, preview and guidance
 * respond before touching their team's real decisions.
 */

const EXAMPLE_BUDGET = 500_000;
/** Example spend already allocated in the other six HR areas. */
const EXAMPLE_OTHER_SPEND = 140_000;
const EXAMPLE_ONBOARDING_PER_HIRE = 500;
const SUGGESTED_RANGE = { min: 20, max: 26 };

const SCREENING = [
  { key: "basic", label: "Basic Screening", costPerHire: 8_200, days: 25 },
  {
    key: "assessment",
    label: "Assessment + Interview",
    costPerHire: 11_187,
    days: 34,
  },
  { key: "panel", label: "Full Panel Evaluation", costPerHire: 15_000, days: 45 },
] as const;

const HOTSPOTS = [
  {
    title: "Round status",
    text: "The current round, your industry, your strategy and the economy condition. Check these before you start — the economy changes what your choices cost and return.",
  },
  {
    title: "Discretionary HR budget",
    text: "One budget covers all seven HR areas. The bar shows how much is allocated and how much remains, and it updates the moment you change any decision.",
  },
  {
    title: "Decision inputs",
    text: "Each area has a few numbered decisions: counters, drop-downs and sliders. Try it — add hires or change the screening rigor and watch the rest of the page respond.",
  },
  {
    title: "Decision impact preview",
    text: "An estimate of what your current choices will cost and how they are likely to move key metrics. It is a preview, not your final result.",
  },
  {
    title: "Decision guidance",
    text: "Shows the suggested investment range for your industry and warns you when you are below or above it. It is advice, not a rule — your strategy may justify going outside the range.",
  },
  {
    title: "Save bar",
    text: "Changes save automatically for the whole team. Use Save & Continue to move on to Review & Submit when your team is ready.",
  },
] as const;

export function DecisionPageTour() {
  const [active, setActive] = useState(0);
  const [hires, setHires] = useState(5);
  const [screening, setScreening] = useState<string>("assessment");
  const [touched, setTouched] = useState(false);

  const rigor = SCREENING.find((s) => s.key === screening) ?? SCREENING[1];
  const recruitmentCost =
    hires * (rigor.costPerHire + EXAMPLE_ONBOARDING_PER_HIRE);
  const used = EXAMPLE_OTHER_SPEND + recruitmentCost;
  const usedPct = Math.min(100, (used / EXAMPLE_BUDGET) * 100);
  const share = (recruitmentCost / EXAMPLE_BUDGET) * 100;
  const rangeState =
    share < SUGGESTED_RANGE.min
      ? "below"
      : share > SUGGESTED_RANGE.max
        ? "above"
        : "within";

  function changeHires(delta: number) {
    setHires((h) => Math.max(0, Math.min(20, h + delta)));
    setTouched(true);
    setActive(2);
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-[var(--portal-sidebar-border)] bg-[#f8fafc] p-3 sm:p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full bg-[var(--portal-brand-soft)] px-2.5 py-0.5 text-[0.6875rem] font-bold uppercase tracking-wide text-[var(--portal-brand)]">
            Practice example · not your team&apos;s data
          </span>
          <span className="text-xs text-[var(--portal-muted)]">
            Select a number to learn what each part does
          </span>
        </div>

        {/* Title + status chips */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-lg font-bold text-[var(--portal-title)]">
              Recruitment &amp; Selection
            </p>
            <p className="text-xs text-[var(--portal-muted)]">
              HR Decisions · 1 of 7
            </p>
          </div>
          <Region n={1} active={active} onSelect={setActive}>
            <div className="flex flex-wrap gap-1.5">
              {[
                ["Round", "Round 1"],
                ["Industry", "High-Tech"],
                ["Strategy", "Innovation"],
                ["Economy", "Normal"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-lg border border-[var(--portal-sidebar-border)] bg-white px-2 py-1"
                >
                  <p className="text-[0.5625rem] font-bold uppercase tracking-wide text-[var(--portal-muted)]">
                    {label}
                  </p>
                  <p className="text-xs font-bold text-[var(--portal-title)]">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </Region>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_210px]">
          <div className="min-w-0 space-y-3">
            {/* Budget */}
            <Region n={2} active={active} onSelect={setActive}>
              <div className="rounded-lg border border-[var(--portal-sidebar-border)] bg-white px-3 py-2.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <span className="font-bold text-[var(--portal-title)]">
                    Discretionary HR Budget
                  </span>
                  <span
                    className="font-bold tabular-nums text-[var(--portal-title)]"
                    aria-live="polite"
                  >
                    {formatCurrency(used)} / {formatCurrency(EXAMPLE_BUDGET)}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#eef1f4]">
                  <div
                    className="h-full rounded-full bg-[var(--portal-success)] transition-all duration-300"
                    style={{ width: `${usedPct}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-[var(--portal-muted)]">
                  <span className="font-semibold text-[var(--portal-success)]">
                    {formatCurrency(EXAMPLE_BUDGET - used)} Remaining
                  </span>{" "}
                  | {usedPct.toFixed(0)}% Used
                </p>
              </div>
            </Region>

            {/* Inputs */}
            <Region n={3} active={active} onSelect={setActive}>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg border border-emerald-200 bg-white px-3 py-2.5">
                  <p className="text-sm font-bold text-emerald-700">
                    1. Hiring Needs
                  </p>
                  <p className="text-[0.6875rem] text-[var(--portal-muted)]">
                    Employees to hire this round
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => changeHires(-1)}
                      disabled={hires === 0}
                      aria-label="Fewer hires"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--portal-sidebar-border)] bg-white hover:bg-[#f8fafc] disabled:opacity-40"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span
                      className="w-8 text-center text-lg font-bold tabular-nums text-[var(--portal-title)]"
                      aria-live="polite"
                    >
                      {hires}
                    </span>
                    <button
                      type="button"
                      onClick={() => changeHires(1)}
                      disabled={hires === 20}
                      aria-label="More hires"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--portal-primary)] bg-[var(--portal-primary-soft)] text-[var(--portal-primary)] hover:bg-white disabled:opacity-40"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    {!touched ? (
                      <span className="ml-1 animate-pulse text-xs font-semibold text-[var(--portal-primary)]">
                        ← Try it
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="rounded-lg border border-[var(--portal-primary)]/30 bg-white px-3 py-2.5">
                  <label
                    htmlFor="tour-screening"
                    className="text-sm font-bold text-[var(--portal-primary)]"
                  >
                    2. Selection Approach
                  </label>
                  <p className="text-[0.6875rem] text-[var(--portal-muted)]">
                    Screening rigor for new hires
                  </p>
                  <select
                    id="tour-screening"
                    value={screening}
                    onChange={(e) => {
                      setScreening(e.target.value);
                      setTouched(true);
                      setActive(2);
                    }}
                    className="mt-2 w-full rounded-md border border-[var(--portal-sidebar-border)] bg-white px-2 py-1.5 text-sm text-[var(--portal-title)]"
                  >
                    {SCREENING.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </Region>

            {/* Impact preview */}
            <Region n={4} active={active} onSelect={setActive}>
              <div className="rounded-lg border border-[var(--portal-sidebar-border)] bg-white px-3 py-2.5">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--portal-title)]">
                  <Eye className="h-3.5 w-3.5 text-[var(--portal-brand)]" />
                  Decision Impact Preview
                </p>
                <div
                  className="mt-2 grid grid-cols-3 gap-2"
                  aria-live="polite"
                >
                  {[
                    ["Total recruitment cost", formatCurrency(recruitmentCost)],
                    [
                      "Cost per hire",
                      formatCurrency(
                        rigor.costPerHire + EXAMPLE_ONBOARDING_PER_HIRE
                      ),
                    ],
                    ["Est. time to fill", `${rigor.days} days`],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-md bg-[#f8fafc] px-2 py-1.5"
                    >
                      <p className="text-[0.5625rem] font-bold uppercase leading-tight tracking-wide text-[var(--portal-muted)]">
                        {label}
                      </p>
                      <p className="text-sm font-bold tabular-nums text-[var(--portal-title)]">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Region>
          </div>

          {/* Guidance */}
          <Region n={5} active={active} onSelect={setActive}>
            <div className="h-full rounded-lg border border-[var(--portal-sidebar-border)] bg-white px-3 py-2.5">
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--portal-brand)]">
                <Lightbulb className="h-3.5 w-3.5" />
                Decision Guidance
              </p>
              <div
                aria-live="polite"
                className={`mt-2 rounded-md border px-2 py-1.5 text-xs ${
                  rangeState === "within"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-red-200 bg-red-50 text-red-800"
                }`}
              >
                <p className="flex items-center gap-1 font-bold">
                  {rangeState === "within" ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  )}
                  {rangeState === "within"
                    ? "Within Suggested Range"
                    : rangeState === "below"
                      ? "Below Suggested Range"
                      : "Above Suggested Range"}
                </p>
                <p className="mt-0.5">
                  Your {share.toFixed(1)}% investment vs. the suggested{" "}
                  {SUGGESTED_RANGE.min}%–{SUGGESTED_RANGE.max}% of HR budget.
                </p>
              </div>
              <div className="relative mt-3 h-1.5 rounded-full bg-[#eef1f4]">
                <div
                  className="absolute inset-y-0 rounded-full bg-emerald-300"
                  style={{
                    left: `${SUGGESTED_RANGE.min * 2}%`,
                    width: `${(SUGGESTED_RANGE.max - SUGGESTED_RANGE.min) * 2}%`,
                  }}
                />
                <div
                  className="absolute -top-1 h-3.5 w-1 rounded bg-[var(--portal-brand)] transition-all duration-300"
                  style={{ left: `${Math.min(100, share * 2)}%` }}
                />
              </div>
              <p className="mt-1.5 text-[0.625rem] text-[var(--portal-muted)]">
                Green = suggested range · Orange = your investment
              </p>
            </div>
          </Region>
        </div>

        {/* Save bar */}
        <div className="mt-3">
          <Region n={6} active={active} onSelect={setActive}>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--portal-sidebar-border)] bg-white px-3 py-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                All changes auto-saved
              </span>
              <span className="rounded-md bg-[var(--portal-primary)] px-2.5 py-1 text-xs font-bold text-white">
                Save &amp; Continue → Review &amp; Submit
              </span>
            </div>
          </Region>
        </div>
      </div>

      {/* Explanation of the selected region */}
      <div className="rounded-xl border border-[var(--portal-primary)]/20 bg-[var(--portal-primary-soft)] px-4 py-3">
        <div className="flex items-start gap-3">
          <Badge n={active + 1} />
          <div className="min-w-0 flex-1">
            <p className="font-bold text-[var(--portal-title)]">
              {HOTSPOTS[active].title}
            </p>
            <p className="mt-0.5 text-sm text-[var(--portal-ink)]">
              {HOTSPOTS[active].text}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex gap-1.5">
            {HOTSPOTS.map((h, i) => (
              <button
                key={h.title}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`${i + 1}. ${h.title}`}
                aria-current={i === active}
                className={`h-2 rounded-full transition-all ${
                  i === active
                    ? "w-6 bg-[var(--portal-primary)]"
                    : "w-2 bg-[var(--portal-primary)]/30 hover:bg-[var(--portal-primary)]/60"
                }`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActive((a) => Math.max(0, a - 1))}
              disabled={active === 0}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-[var(--portal-primary)] hover:bg-white disabled:opacity-40"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Previous
            </button>
            <button
              type="button"
              onClick={() =>
                setActive((a) => Math.min(HOTSPOTS.length - 1, a + 1))
              }
              disabled={active === HOTSPOTS.length - 1}
              className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-semibold text-[var(--portal-primary)] hover:bg-[#f8fafc] disabled:opacity-40"
            >
              Next part <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ n, active = true }: { n: number; active?: boolean }) {
  return (
    <span
      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
        active
          ? "bg-[var(--portal-brand)] text-white"
          : "border border-[var(--portal-brand)] bg-white text-[var(--portal-brand)]"
      }`}
    >
      {n}
    </span>
  );
}

/** A numbered, selectable region of the example page. */
function Region({
  n,
  active,
  onSelect,
  children,
}: {
  n: number;
  active: number;
  onSelect: (index: number) => void;
  children: React.ReactNode;
}) {
  const isActive = active === n - 1;
  return (
    <div
      className={`relative rounded-xl p-1 transition-shadow ${
        isActive
          ? "ring-2 ring-[var(--portal-brand)] ring-offset-1"
          : "ring-1 ring-transparent"
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect(n - 1)}
        aria-label={`Explain part ${n}: ${HOTSPOTS[n - 1].title}`}
        aria-pressed={isActive}
        className="absolute -left-3 -top-3 z-10 rounded-full shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--portal-primary)]"
      >
        <Badge n={n} active={isActive} />
      </button>
      {children}
    </div>
  );
}
