import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Compass,
  GraduationCap,
  HeartHandshake,
  LayoutGrid,
  Lightbulb,
  Network,
  Scale,
  Star,
  Target,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { PreSimContent, PreSimSlug } from "@/lib/student/pre-sim-content";

const MODULE_ICONS: Record<PreSimSlug, LucideIcon> = {
  recruitment: UserPlus,
  performance: Briefcase,
  training: GraduationCap,
  relations: HeartHandshake,
  compensation: Wallet,
  "org-design": Network,
  dei: Scale,
};

const WHY_ICONS: LucideIcon[] = [Users, Star, HeartHandshake, TrendingUp];

export function PreSimModuleView({
  slug,
  content,
}: {
  slug: PreSimSlug;
  content: PreSimContent;
}) {
  const HeroIcon = MODULE_ICONS[slug];

  return (
    <div className="bg-white pb-10">
      <div className="mx-auto max-w-5xl px-4 pt-4 sm:px-6">
        <Link
          href="/"
          className="text-xs font-bold text-[var(--portal-brand)] hover:underline"
        >
          ← Back to Real HR Simulation
        </Link>

        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,422px)] lg:items-start">
          <div>
            <div className="flex items-start gap-4">
              <span className="inline-flex h-[94px] w-[94px] shrink-0 items-center justify-center rounded-full border-[3px] border-[var(--portal-brand)] text-[var(--portal-brand)]">
                <HeroIcon className="h-10 w-10" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 pt-3">
                <h1 className="text-3xl font-bold text-[var(--portal-title)] sm:text-4xl">
                  {content.title}
                </h1>
                <p className="mt-2 text-base text-[#24365a]">{content.subtitle}</p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-[#24365a] sm:text-[15px]">
              {content.intro}
            </p>
          </div>
          <div className="overflow-hidden rounded-xl border border-[var(--portal-sidebar-border)] bg-[#f8fafc]">
            <Image
              src={content.heroImage}
              alt=""
              width={844}
              height={544}
              className="aspect-[422/272] h-auto w-full object-cover"
              priority
            />
          </div>
        </div>

        <section className="mt-10">
          <h2 className="text-[23px] font-bold text-[var(--portal-title)]">
            {content.whatIsTitle}
          </h2>
          <p className="mt-4 max-w-4xl text-sm leading-relaxed text-[#24365a] sm:text-[15px]">
            {content.whatIs}
          </p>
        </section>

        <hr className="my-8 border-[var(--portal-sidebar-border)]" />

        <section>
          <h2 className="text-[23px] font-bold text-[var(--portal-title)]">
            2. Why Does It Matter?
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {content.whyCards.map((card, i) => {
              const Icon = WHY_ICONS[i % WHY_ICONS.length];
              return (
                <article
                  key={card.title}
                  className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--portal-brand-soft)] text-[var(--portal-brand)]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 text-sm font-bold leading-snug text-[var(--portal-title)]">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-[13px] leading-relaxed text-[#24365a]">
                    {card.body}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <hr className="my-8 border-[var(--portal-sidebar-border)]" />

        <div className="grid gap-8 lg:grid-cols-2">
          <section>
            <h2 className="text-[22px] font-bold text-[var(--portal-title)]">
              3. Decisions You May Encounter
            </h2>
            <p className="mt-3 text-sm text-[#24365a]">
              As your team manages the organization, you may encounter decisions
              involving:
            </p>
            <ul className="mt-4 space-y-2 text-sm text-[#24365a]">
              {content.decisions.map((d) => (
                <li key={d} className="flex gap-2">
                  <span className="text-[var(--portal-title)]">•</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 rounded-xl border border-[var(--portal-brand)]/25 bg-[var(--portal-brand-soft)] p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-[var(--portal-brand)]">
                <Lightbulb className="h-4 w-4" />
                Think Like an HR Leader
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-[#24365a]">
                {content.thinkLike}
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-[21px] font-bold text-[var(--portal-title)]">
              {content.connectingTitle}
            </h2>
            <p className="mt-3 text-sm text-[#24365a]">{content.connecting}</p>

            <div className="mt-5 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
              <FlowCard
                title={content.flow.decisionsLabel}
                items={content.flow.decisionsItems}
                tone="brand"
              />
              <ArrowRight className="mx-auto hidden h-6 w-6 shrink-0 text-[var(--portal-title)] sm:block" />
              <FlowCard
                title="Workforce Outcomes"
                items={content.flow.workforceItems}
                tone="primary"
              />
              <ArrowRight className="mx-auto hidden h-6 w-6 shrink-0 text-[var(--portal-title)] sm:block" />
              <FlowCard
                title="Organizational Outcomes"
                items={content.flow.orgItems}
                tone="emerald"
              />
            </div>
            <p className="mt-5 text-sm font-medium text-[#24365a]">
              {content.challenge}
            </p>
          </section>
        </div>

        <hr className="my-8 border-[var(--portal-sidebar-border)]" />

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start">
          <div>
            <h2 className="text-[22px] font-bold text-[var(--portal-title)]">
              Before You Enter the Simulation
            </h2>
            <p className="mt-3 text-sm font-medium text-[#24365a]">Consider:</p>
            <ol className="mt-3 space-y-2.5">
              {content.beforeQuestions.map((q, i) => (
                <li key={q} className="flex gap-2.5 text-sm text-[#24365a]">
                  <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--portal-brand)] text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                  {q}
                </li>
              ))}
            </ol>
          </div>
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--portal-sidebar-border)] bg-[#f8fafc] px-4 py-6 text-center">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--portal-brand-soft)] text-[var(--portal-brand)]">
              <Compass className="h-5 w-5" />
            </span>
            <div className="mt-4 flex items-end gap-3 text-[var(--portal-title)]">
              <Users className="h-5 w-5" />
              <Target className="h-5 w-5" />
              <LayoutGrid className="h-5 w-5" />
            </div>
          </div>
        </section>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/#modules"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-[var(--portal-brand)] bg-white px-6 text-sm font-bold text-[var(--portal-brand)] hover:bg-[var(--portal-brand-soft)]"
          >
            <LayoutGrid className="h-4 w-4" />
            Explore Other HR Decision Modules
          </Link>
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--portal-brand)] px-8 text-sm font-bold text-white hover:bg-[var(--portal-brand-hover)]"
          >
            Sign In to Begin
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function FlowCard({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "brand" | "primary" | "emerald";
}) {
  const toneClass =
    tone === "brand"
      ? "border-[var(--portal-brand)]/30 bg-[var(--portal-brand-soft)]"
      : tone === "primary"
        ? "border-[var(--portal-primary)]/30 bg-[var(--portal-primary-soft)]"
        : "border-emerald-200 bg-emerald-50";

  return (
    <div className={`min-w-0 flex-1 rounded-xl border p-3 ${toneClass}`}>
      <p className="text-xs font-bold text-[var(--portal-title)]">{title}</p>
      <ul className="mt-2 space-y-1.5 text-[11px] leading-snug text-[#24365a]">
        {items.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}
