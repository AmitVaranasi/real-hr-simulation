import Link from "next/link";
import { CalendarDays, Check, Factory, Globe2, Target } from "lucide-react";
import { StudentPageHeader } from "@/components/student/shell/StudentShell";
import { TeamSubnav } from "@/components/student/TeamSubnav";
import type { StudentTeamContext } from "@/lib/student/team-context";

export const TEAM_PAGE_SUBTITLE =
  "Learn about your simulated company, your team, and key context for this round.";

export function economyLabel(value: string | null | undefined) {
  if (!value) return "—";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatJoinedDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function nameInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function TeamContextChips({ ctx }: { ctx: StudentTeamContext }) {
  const cards = [
    {
      label: "Round",
      icon: CalendarDays,
      iconClass: "text-[var(--portal-icon-blue)]",
      value: ctx.openRound
        ? `Round ${ctx.openRound.round_number}`
        : "No Round Open",
      badge: ctx.openRound ? ctx.openRound.status.toUpperCase() : null,
    },
    {
      label: "Industry",
      icon: Factory,
      iconClass: "text-[var(--portal-icon-green)]",
      value: ctx.team?.industry ?? "—",
    },
    {
      label: "Strategy",
      icon: Target,
      iconClass: "text-[var(--portal-icon-orange)]",
      value: ctx.team?.strategy ?? "—",
    },
    {
      label: "Economy",
      icon: Globe2,
      iconClass: "text-[var(--portal-icon-purple)]",
      value: economyLabel(ctx.openRound?.economy_condition),
    },
  ];

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="min-w-[88px] rounded-lg border border-[var(--portal-sidebar-border)] bg-white px-2.5 py-1.5 shadow-sm"
          >
            <p className="flex items-center gap-1 text-[0.5625rem] font-bold uppercase tracking-wide text-[var(--portal-muted)]">
              <Icon className={`h-3 w-3 ${card.iconClass}`} strokeWidth={2} />
              {card.label}
            </p>
            <p className="mt-0.5 text-[0.75rem] font-semibold text-[var(--portal-ink)]">
              {card.value}
              {card.badge ? (
                <span className="ml-1 rounded bg-emerald-100 px-1 py-px text-[0.5625rem] font-bold text-emerald-700">
                  {card.badge}
                </span>
              ) : null}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export function TeamStickyFooter() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-[var(--portal-sidebar-border)] bg-white/95 backdrop-blur lg:left-[var(--portal-sidebar-width)]">
      <div className="mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-md border border-[var(--portal-accent-blue)] bg-white px-3.5 py-2 text-sm font-semibold text-[var(--portal-accent-blue)] hover:bg-[var(--portal-accent-blue-soft)]"
        >
          ← Back to Dashboard
        </Link>
        <p className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
          All changes auto-saved
        </p>
        <button
          type="button"
          className="rounded-md bg-[var(--portal-accent-blue)] px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Save Now
        </button>
      </div>
    </div>
  );
}

export function TeamPageShell({
  ctx,
  activeHref,
  children,
}: {
  ctx: StudentTeamContext;
  activeHref: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative mx-auto w-full pb-20">
      <StudentPageHeader
        title="Team & Company"
        subtitle={TEAM_PAGE_SUBTITLE}
        actions={<TeamContextChips ctx={ctx} />}
      />
      <TeamSubnav activeHref={activeHref} />
      {children}
      <TeamStickyFooter />
    </div>
  );
}
