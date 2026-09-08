import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export function FilterCard({
  label,
  hint,
  value,
  onChange,
  children,
  variant = "card",
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  variant?: "card" | "field";
}) {
  if (variant === "field") {
    return (
      <label className="min-w-0">
        <span className="block text-[0.625rem] font-bold text-[var(--portal-title)]">
          {label}
        </span>
        <span className="relative mt-1 flex items-center rounded-md border border-[var(--portal-sidebar-border)] bg-white px-2.5 py-1.5">
          <select
            className="w-full appearance-none border-0 bg-transparent py-0 pr-5 text-[0.625rem] text-[var(--portal-title)] outline-none focus:ring-0"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-label={label}
          >
            {children}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-[var(--portal-title)]"
            strokeWidth={2.25}
          />
        </span>
      </label>
    );
  }

  return (
    <label className="relative flex min-h-[56px] items-center rounded-lg border border-[var(--portal-sidebar-border)] bg-white px-3.5 py-2 shadow-sm">
      <span className="min-w-0 flex-1 pr-5">
        <span className="sr-only">{label}</span>
        <select
          className="w-full appearance-none border-0 bg-transparent p-0 text-[0.6875rem] font-bold text-[var(--portal-title)] outline-none focus:ring-0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
        >
          {children}
        </select>
        {hint ? (
          <span className="block text-[0.625rem] leading-tight text-[var(--portal-title)]">
            {hint}
          </span>
        ) : null}
      </span>
      <ChevronDown
        className="pointer-events-none absolute right-3 h-3.5 w-3.5 text-[var(--portal-title)]"
        strokeWidth={2.25}
      />
    </label>
  );
}

export function KpiBoard({
  tiles,
}: {
  tiles: Array<{
    label: string;
    value: string;
    hint?: string;
    icon: ReactNode;
    iconWrap: string;
  }>;
}) {
  return (
    <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white px-2 py-3 shadow-sm">
      <div
        className={`grid divide-x divide-[var(--portal-sidebar-border)] ${
          tiles.length >= 5
            ? "grid-cols-2 lg:grid-cols-5"
            : tiles.length === 4
              ? "grid-cols-2 lg:grid-cols-4"
              : "grid-cols-2 lg:grid-cols-3"
        }`}
      >
        {tiles.map((tile) => (
          <div key={tile.label} className="flex items-start gap-2.5 px-3 py-1">
            <span
              className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tile.iconWrap}`}
            >
              {tile.icon}
            </span>
            <div className="min-w-0">
              <p className="text-[0.625rem] text-[var(--portal-title)]">
                {tile.label}
              </p>
              <p className="mt-0.5 line-clamp-2 break-words text-lg font-bold leading-tight text-[var(--portal-title)]">
                {tile.value}
              </p>
              {tile.hint ? (
                <p className="mt-1 line-clamp-2 text-[0.625rem] leading-tight text-[var(--portal-title)]">
                  {tile.hint}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ViewByToggle({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ id: string; label: string }>;
}) {
  return (
    <div className="flex min-w-0 flex-wrap overflow-hidden rounded-xl border border-[var(--portal-sidebar-border)] bg-white">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={`min-w-0 flex-1 px-2 py-2.5 text-center text-[0.6875rem] font-semibold ${
            value === opt.id
              ? "bg-[var(--portal-accent-blue)] text-white"
              : "text-[var(--portal-ink)] hover:bg-[#f4f7fb]"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function RankBadge({ rank }: { rank: number | null }) {
  if (rank == null) {
    return <span className="text-[var(--portal-muted)]">—</span>;
  }
  const tone =
    rank === 1
      ? "bg-[#159b55] text-white"
      : rank === 2
        ? "bg-[#0b57ff] text-white"
        : rank === 3
          ? "bg-[#ff5a00] text-white"
          : "bg-[#e8eaee] text-[var(--portal-title)]";
  return (
    <span
      className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[0.5rem] font-bold ${tone}`}
    >
      {rank}
    </span>
  );
}

export function ScoreBar({ value }: { value: number | null }) {
  if (value == null) return <span className="text-[var(--portal-muted)]">—</span>;
  return (
    <div className="flex min-w-[4.25rem] items-center gap-1.5">
      <span className="tabular-nums">{value.toFixed(1)}</span>
      <span className="h-1.5 w-10 overflow-hidden rounded bg-[#eef1f4]">
        <span
          className="block h-full bg-[var(--portal-accent-blue)]"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </span>
    </div>
  );
}

export function DeltaPill({ value }: { value: number | null }) {
  if (value == null) return <span className="text-[var(--portal-muted)]">—</span>;
  const sign = value > 0 ? "+" : "";
  const tone =
    value > 0
      ? "bg-emerald-50 text-emerald-800"
      : value < 0
        ? "bg-rose-50 text-rose-800"
        : "bg-[#f1f3f5] text-[var(--portal-ink)]";
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-[0.6875rem] font-semibold tabular-nums ${tone}`}
    >
      {sign}
      {value.toFixed(1)}
    </span>
  );
}

export function spendAxisMax(values: Array<number | null | undefined>) {
  const peak = Math.max(0, ...values.filter((v): v is number => v != null));
  const step = 25_000;
  return Math.max(100_000, Math.ceil(peak / step) * step);
}

export function AreaSpendBar({
  label,
  value,
  max,
  share,
}: {
  label: string;
  value: number | null;
  max: number;
  share: number | null;
}) {
  const width =
    value == null || max <= 0 ? 0 : Math.min(100, (value / max) * 100);
  return (
    <div className="grid grid-cols-[minmax(0,9.25rem)_minmax(0,1fr)_2.4rem_1.6rem] items-center gap-2">
      <span className="truncate text-[0.5625rem] text-[var(--portal-title)]">
        {label}
      </span>
      <span className="h-2 overflow-hidden rounded-sm bg-[#d9e4f5]">
        <span
          className="block h-full rounded-sm bg-[var(--portal-accent-blue)]"
          style={{ width: `${width}%` }}
        />
      </span>
      <span className="text-right text-[0.5625rem] font-bold tabular-nums text-[var(--portal-title)]">
        {value == null ? "—" : compactUsd(value)}
      </span>
      <span className="text-right text-[0.5625rem] font-bold tabular-nums text-[var(--portal-title)]">
        {share == null ? "—" : `${Math.round(share)}%`}
      </span>
    </div>
  );
}

export function AreaSpendAxis({ max }: { max: number }) {
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((part) => compactUsd(max * part));
  return (
    <div className="flex justify-between text-[0.5rem] text-[var(--portal-muted)]">
      {ticks.map((tick) => (
        <span key={tick}>{tick}</span>
      ))}
    </div>
  );
}

export function compactUsd(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${Math.round(value / 1000)}K`;
  return `$${Math.round(value)}`;
}

export function DonutScore({
  overall,
  slices,
}: {
  overall: number | null;
  slices: Array<{ label: string; value: number | null; color: string }>;
}) {
  const known = slices.filter((s) => s.value != null) as Array<{
    label: string;
    value: number;
    color: string;
  }>;
  const total = known.reduce((sum, s) => sum + s.value, 0);
  let cursor = 0;
  const stops = known.map((s) => {
    const start = cursor;
    cursor += total > 0 ? (s.value / total) * 100 : 0;
    return `${s.color} ${start}% ${cursor}%`;
  });

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div
        className="relative h-28 w-28 shrink-0 rounded-full"
        style={{
          background:
            stops.length > 0
              ? `conic-gradient(${stops.join(", ")})`
              : "#e8eaee",
        }}
      >
        <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-white">
          <p className="text-xl font-bold text-[var(--portal-title)]">
            {overall == null ? "—" : overall.toFixed(1)}
          </p>
          <p className="text-[0.625rem] text-[var(--portal-muted)]">
            Overall Average
          </p>
        </div>
      </div>
      <ul className="min-w-[10rem] space-y-2 text-sm">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ background: s.color }}
              />
              {s.label}
            </span>
            <span className="tabular-nums text-[var(--portal-muted)]">
              {s.value == null ? "—" : s.value.toFixed(1)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
