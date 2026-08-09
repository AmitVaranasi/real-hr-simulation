import type { LucideIcon } from "lucide-react";
import { CircleHelp, Clock3, Coins, Eye, UserRound } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type MetricAccent = "brand" | "blue" | "emerald" | "orange" | "violet";

interface MetricPreviewProps {
  items: Array<{
    label: string;
    value: string;
    icon?: LucideIcon;
    accent?: MetricAccent;
  }>;
  /** Show the “How These Estimates Are Calculated” affordance. */
  showCalcLink?: boolean;
  calcTitle?: string;
}

const DEFAULT_ICONS: LucideIcon[] = [Coins, UserRound, Clock3];

const ACCENT_MAP: Record<
  MetricAccent,
  { wrap: string; icon: string }
> = {
  brand: {
    wrap: "border-[var(--portal-brand)]/20 bg-[var(--portal-brand-soft)] text-[var(--portal-brand)]",
    icon: "bg-white/80 text-[var(--portal-brand)]",
  },
  blue: {
    wrap: "border-blue-200 bg-blue-50 text-[var(--portal-accent-blue)]",
    icon: "bg-white/80 text-[var(--portal-accent-blue)]",
  },
  emerald: {
    wrap: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: "bg-white/80 text-emerald-700",
  },
  orange: {
    wrap: "border-orange-200 bg-orange-50 text-[var(--portal-icon-orange)]",
    icon: "bg-white/80 text-[var(--portal-icon-orange)]",
  },
  violet: {
    wrap: "border-violet-200 bg-violet-50 text-[var(--portal-icon-purple)]",
    icon: "bg-white/80 text-[var(--portal-icon-purple)]",
  },
};

const DEFAULT_ACCENT_ORDER: MetricAccent[] = [
  "brand",
  "blue",
  "emerald",
  "violet",
];

export function MetricPreview({
  items,
  showCalcLink = false,
  calcTitle = "Estimates update live from your decisions in this module.",
}: MetricPreviewProps) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.06em] text-[var(--portal-title)]">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--portal-brand-soft)] text-[var(--portal-brand)]">
            <Eye className="h-3.5 w-3.5" strokeWidth={2.25} />
          </span>
          Decision Impact Preview
        </p>
        {showCalcLink ? (
          <button
            type="button"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--portal-accent-blue)] hover:underline"
            title={calcTitle}
          >
            <CircleHelp className="h-3.5 w-3.5" strokeWidth={2} />
            How These Estimates Are Calculated
          </button>
        ) : null}
      </div>
      <div
        className={`mt-3 grid gap-3 ${
          items.length >= 4 ? "sm:grid-cols-2 xl:grid-cols-4" : "sm:grid-cols-3"
        }`}
      >
        {items.map((item, i) => {
          const accentKey =
            item.accent ?? DEFAULT_ACCENT_ORDER[i % DEFAULT_ACCENT_ORDER.length];
          const accent = ACCENT_MAP[accentKey];
          const Icon = item.icon ?? DEFAULT_ICONS[i % DEFAULT_ICONS.length];
          return (
            <div
              key={item.label}
              className={`rounded-lg border px-3 py-3 ${accent.wrap}`}
            >
              <div className="flex items-start gap-2.5">
                <span
                  className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${accent.icon}`}
                >
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-lg font-bold text-[var(--portal-title)]">
                    {item.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function formatPreviewCurrency(value: number): string {
  return formatCurrency(value);
}
