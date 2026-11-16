import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BarChart3,
  Lightbulb,
  Settings,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  PERSPECTIVES,
  type PerspectiveId,
  type PerspectiveWeights,
} from "@/lib/student/bsc-reference";

/** One colour per perspective, reused on every scorecard reference page. */
export const PERSPECTIVE_STYLE: Record<
  PerspectiveId,
  {
    icon: LucideIcon;
    text: string;
    soft: string;
    border: string;
    chip: string;
    dot: string;
    /** Raw colour for the weight donut. */
    hex: string;
  }
> = {
  financial: {
    icon: BarChart3,
    text: "text-blue-700",
    soft: "bg-blue-50",
    border: "border-blue-200",
    chip: "bg-blue-100 text-blue-800",
    dot: "bg-blue-600",
    hex: "#2563eb",
  },
  employee: {
    icon: Users,
    text: "text-emerald-700",
    soft: "bg-emerald-50",
    border: "border-emerald-200",
    chip: "bg-emerald-100 text-emerald-800",
    dot: "bg-emerald-600",
    hex: "#059669",
  },
  process: {
    icon: Settings,
    text: "text-violet-700",
    soft: "bg-violet-50",
    border: "border-violet-200",
    chip: "bg-violet-100 text-violet-800",
    dot: "bg-violet-600",
    hex: "#7c3aed",
  },
  learning: {
    icon: Lightbulb,
    text: "text-orange-700",
    soft: "bg-orange-50",
    border: "border-orange-200",
    chip: "bg-orange-100 text-orange-800",
    dot: "bg-orange-500",
    hex: "#f97316",
  },
};

export function PerspectiveChip({ id }: { id: PerspectiveId }) {
  const title = PERSPECTIVES.find((p) => p.id === id)!.title;
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${PERSPECTIVE_STYLE[id].chip}`}
    >
      {title}
    </span>
  );
}

export function SectionTitle({
  icon: Icon,
  title,
  subtitle,
}: {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      {Icon ? (
        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--portal-primary)]" />
      ) : null}
      <div>
        <h2 className="text-lg font-bold text-[var(--portal-title)]">{title}</h2>
        {subtitle ? (
          <p className="mt-0.5 text-sm text-[var(--portal-muted)]">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}

export function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}

export function KeyTakeaway({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-emerald-700" />
        <h2 className="text-lg font-bold text-[var(--portal-title)]">Key Takeaway</h2>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-[var(--portal-ink)]">
        {children}
      </p>
    </section>
  );
}

export function Callout({
  title,
  icon: Icon,
  tone = "blue",
  children,
}: {
  title: string;
  icon: LucideIcon;
  tone?: "blue" | "amber" | "green";
  children: React.ReactNode;
}) {
  const tones = {
    blue: "border-[var(--portal-primary)]/20 bg-[var(--portal-primary-soft)] text-[var(--portal-primary)]",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
  return (
    <section className={`rounded-xl border p-5 ${tones[tone]}`}>
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5" />
        <h2 className="text-lg font-bold text-[var(--portal-title)]">{title}</h2>
      </div>
      <div className="mt-2 text-sm leading-relaxed text-[var(--portal-ink)]">
        {children}
      </div>
    </section>
  );
}

export type FlowStep = {
  title: string;
  body?: string;
  icon?: LucideIcon;
  tone?: PerspectiveId | "neutral";
};

/** Numbered left-to-right steps; stacks vertically on small screens. */
export function StepFlow({ steps }: { steps: FlowStep[] }) {
  return (
    <ol className="flex flex-col gap-2 lg:flex-row lg:items-stretch">
      {steps.map((s, i) => {
        const style =
          s.tone && s.tone !== "neutral" ? PERSPECTIVE_STYLE[s.tone] : null;
        const Icon = s.icon;
        return (
          <li key={s.title} className="flex min-w-0 flex-col items-center gap-2 lg:flex-1 lg:flex-row">
            <div
              className={`w-full min-w-0 flex-1 rounded-xl border p-3.5 ${
                style
                  ? `${style.border} ${style.soft}`
                  : "border-[var(--portal-primary)]/20 bg-[var(--portal-primary-soft)]"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                    style ? style.dot : "bg-[var(--portal-primary)]"
                  }`}
                >
                  {i + 1}
                </span>
                {Icon ? (
                  <Icon
                    aria-hidden
                    className={`h-4 w-4 ${style ? style.text : "text-[var(--portal-primary)]"}`}
                  />
                ) : null}
              </div>
              <h3 className="mt-1.5 text-sm font-bold leading-snug text-[var(--portal-title)]">
                {s.title}
              </h3>
              {s.body ? (
                <p className="mt-1.5 text-xs leading-relaxed text-[var(--portal-ink)]">
                  {s.body}
                </p>
              ) : null}
            </div>
            {i < steps.length - 1 ? (
              <>
                <ArrowRight
                  aria-hidden
                  className="hidden h-4 w-4 shrink-0 text-[var(--portal-primary)] lg:block"
                />
                <ArrowDown
                  aria-hidden
                  className="h-4 w-4 shrink-0 text-[var(--portal-primary)] lg:hidden"
                />
              </>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

/** Four-colour donut. Equal quarters unless weights are given. */
export function PerspectiveDonut({
  weights,
  label,
}: {
  weights?: PerspectiveWeights | null;
  label: string;
}) {
  const w = weights ?? { financial: 25, employee: 25, process: 25, learning: 25 };
  const total = w.financial + w.employee + w.process + w.learning || 1;
  const stops = PERSPECTIVES.map((p, i) => {
    const before = PERSPECTIVES.slice(0, i).reduce((sum, q) => sum + w[q.id], 0);
    const from = (before / total) * 100;
    const to = ((before + w[p.id]) / total) * 100;
    return `${PERSPECTIVE_STYLE[p.id].hex} ${from}% ${to}%`;
  }).join(", ");
  return (
    <div
      role="img"
      aria-label={`${label}: ${PERSPECTIVES.map((p) => `${p.title} ${w[p.id]}%`).join(", ")}`}
      className="relative mx-auto h-40 w-40 shrink-0 rounded-full"
      style={{ background: `conic-gradient(${stops})` }}
    >
      <div className="absolute inset-[22%] flex items-center justify-center rounded-full bg-white text-center text-xs font-bold leading-tight text-[var(--portal-title)]">
        {label}
      </div>
    </div>
  );
}

export function DirectionTag({ direction }: { direction: "higher" | "lower" }) {
  const Icon = direction === "higher" ? ArrowUp : ArrowDown;
  return (
    <span className="inline-flex items-center gap-0.5 whitespace-nowrap text-[0.6875rem] font-semibold text-[var(--portal-muted)]">
      <Icon className="h-3 w-3" aria-hidden />
      {direction === "higher" ? "Higher is better" : "Lower is better"}
    </span>
  );
}
