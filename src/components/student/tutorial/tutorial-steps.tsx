"use client";

import { useState } from "react";
import {
  BarChart3,
  Briefcase,
  CalendarClock,
  Check,
  ClipboardList,
  FileCheck2,
  FileText,
  MapPin,
  MessageSquare,
  Monitor,
  RotateCcw,
  Trophy,
  Users,
} from "lucide-react";
import { MODULE_SCAFFOLDING } from "@/components/decisions/ScaffoldingText";
import { DECISION_TABS } from "@/components/portal/portal-nav";
import { formatCurrency } from "@/lib/utils";

export type TutorialCompany = {
  name: string;
  industry: string;
  strategy: string;
  courseName: string | null;
  practiceRounds: number;
  competitiveRounds: number;
  headcount: number | null;
  revenue: number | null;
  turnover: number | null;
  satisfaction: number | null;
  engagement: number | null;
  weights: {
    financial: number;
    employee: number;
    process: number;
    learning: number;
  } | null;
  strategyPoints: string[];
};

export function Callout({
  children,
  tone = "blue",
}: {
  children: React.ReactNode;
  tone?: "blue" | "orange";
}) {
  const cls =
    tone === "orange"
      ? "border-[var(--portal-brand)]/30 bg-[var(--portal-brand-soft)]"
      : "border-[var(--portal-primary)]/20 bg-[var(--portal-primary-soft)]";
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${cls}`}>{children}</div>
  );
}

/* ------------------------------------------------------- 1. The case -- */

export function CaseStep({ company }: { company: TutorialCompany | null }) {
  if (!company) {
    return (
      <>
        <div className="rounded-2xl bg-[var(--portal-navy)] px-5 py-5 text-white">
          <p className="text-xs font-bold uppercase tracking-wider text-white/70">
            Your assignment
          </p>
          <p className="mt-1 text-2xl font-bold">
            Lead the HR team of a company
          </p>
          <p className="mt-1 text-sm text-white/80">
            Each team runs its own company. The companies compete in the same
            industry over several rounds.
          </p>
        </div>
        <p>
          Your company has a business strategy, a workforce, and a limited HR
          budget. Each round your team decides how to recruit, develop, pay,
          engage, and organize its people — and those choices shape both the
          workforce and the company&apos;s financial results.
        </p>
        <Callout tone="orange">
          You haven&apos;t joined a team yet. Once you enter the join code from
          your instructor, this step will show your own company&apos;s
          situation. Replay the orientation from{" "}
          <strong>Getting Started</strong> after you join.
        </Callout>
      </>
    );
  }

  const challenges = [
    company.turnover != null
      ? {
          value: `${company.turnover}%`,
          label: "Annual turnover",
          text: "Every departure costs money and know-how.",
        }
      : null,
    company.satisfaction != null
      ? {
          value: `${company.satisfaction}/100`,
          label: "Employee satisfaction",
          text: "Clear room to improve.",
        }
      : null,
    company.engagement != null
      ? {
          value: `${company.engagement}/100`,
          label: "Engagement",
          text: "Engaged employees stay and perform.",
        }
      : null,
  ].filter((c) => c !== null);

  return (
    <>
      <div className="rounded-2xl bg-[var(--portal-navy)] px-5 py-5 text-white">
        <p className="text-xs font-bold uppercase tracking-wider text-white/70">
          Your assignment
        </p>
        <p className="mt-1 text-2xl font-bold sm:text-[1.75rem]">
          {company.name}
        </p>
        <p className="mt-1 text-sm text-white/80">
          {company.industry} · {company.strategy} strategy
          {company.courseName ? ` · ${company.courseName}` : ""}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <HeroFact
            icon={<Briefcase className="h-3.5 w-3.5" />}
            label="Your role"
            value="HR leadership team"
          />
          {company.headcount != null ? (
            <HeroFact
              icon={<Users className="h-3.5 w-3.5" />}
              label="Workforce"
              value={`${company.headcount.toLocaleString()} employees`}
            />
          ) : null}
          {company.revenue != null ? (
            <HeroFact
              icon={<BarChart3 className="h-3.5 w-3.5" />}
              label="Starting revenue"
              value={formatCurrency(company.revenue)}
            />
          ) : null}
        </div>
      </div>

      <p>
        Your team has just been appointed to lead HR at{" "}
        <strong>{company.name}</strong>, a <strong>{company.industry}</strong>{" "}
        company competing with a <strong>{company.strategy}</strong> strategy.
        Leadership expects HR to build a workforce that can deliver that
        strategy — while keeping people costs under control. Other teams in
        your class run competing companies, so your results are compared
        against theirs.
      </p>

      {challenges.length > 0 ? (
        <div>
          <h2 className="font-bold text-[var(--portal-title)]">
            The situation you inherit
          </h2>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            {challenges.map((c) => (
              <div
                key={c.label}
                className="rounded-xl border border-[var(--portal-sidebar-border)] border-l-4 border-l-[var(--portal-brand)] bg-white px-4 py-3"
              >
                <p className="text-2xl font-bold tabular-nums text-[var(--portal-title)]">
                  {c.value}
                </p>
                <p className="text-sm font-semibold text-[var(--portal-title)]">
                  {c.label}
                </p>
                <p className="mt-0.5 text-xs text-[var(--portal-muted)]">
                  {c.text}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3">
            The talent market is competitive, and your HR budget will not
            stretch to do everything at once. <strong>You will have to
            choose.</strong>
          </p>
        </div>
      ) : null}

      <Callout>
        The full picture — industry outlook, competitors and HR implications —
        is under <strong>Team &amp; Company › Industry &amp; Strategy
        Brief</strong>. Read it with your team before your first decisions.
      </Callout>
    </>
  );
}

function HeroFact({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-white/10 px-3 py-2">
      <p className="flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-white/70">
        {icon}
        {label}
      </p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}

/* ------------------------------------------------------- 2. Your goal -- */

export function GoalStep({ company }: { company: TutorialCompany | null }) {
  const w = company?.weights;
  const perspectives = [
    {
      label: "Financial",
      value: w?.financial,
      bar: "bg-[var(--portal-primary)]",
      text: "Revenue, profit, cost discipline and return on HR spend.",
    },
    {
      label: "Employee",
      value: w?.employee,
      bar: "bg-emerald-500",
      text: "Satisfaction, engagement, retention and inclusion.",
    },
    {
      label: "Internal Process",
      value: w?.process,
      bar: "bg-sky-500",
      text: "Hiring speed, turnover, absenteeism and review coverage.",
    },
    {
      label: "Learning & Growth",
      value: w?.learning,
      bar: "bg-[var(--portal-brand)]",
      text: "Training, succession, HR technology and capability.",
    },
  ];
  const top = Math.max(...perspectives.map((p) => p.value ?? 0));

  return (
    <>
      <p>
        Your goal is to make HR decisions that{" "}
        <strong>fit your company&apos;s strategy</strong> and improve its
        performance round after round. Every round is scored on an{" "}
        <strong>HR Balanced Scorecard worth 100 points</strong>, split across
        four perspectives:
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {perspectives.map((p) => {
          const isTop = p.value != null && p.value === top;
          return (
            <div
              key={p.label}
              className={`rounded-xl border px-4 py-3 ${
                isTop
                  ? "border-[var(--portal-primary)]/40 bg-[var(--portal-primary-soft)]/40"
                  : "border-[var(--portal-sidebar-border)]"
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-bold text-[var(--portal-title)]">
                  {p.label}
                </h3>
                {p.value != null ? (
                  <span className="text-sm font-bold tabular-nums text-[var(--portal-title)]">
                    {p.value} pts
                  </span>
                ) : null}
              </div>
              {p.value != null ? (
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#eef1f4]">
                  <div
                    className={`h-full rounded-full ${p.bar}`}
                    style={{ width: `${(p.value / top) * 100}%` }}
                  />
                </div>
              ) : null}
              <p className="mt-2 text-sm text-[var(--portal-muted)]">{p.text}</p>
              {isTop ? (
                <p className="mt-1.5 text-xs font-bold text-[var(--portal-primary)]">
                  Highest weight for your strategy
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
      {company ? (
        <div>
          <p>
            The point weights are set by your{" "}
            <strong>{company.strategy}</strong> strategy — they tell you what
            your company values most. To execute it well:
          </p>
          <ul className="mt-2 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {company.strategyPoints.map((pt) => (
              <li key={pt} className="flex items-start gap-2 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--portal-brand)]" />
                {pt}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p>
          How many points each perspective is worth depends on your
          company&apos;s strategy.
        </p>
      )}
      <Callout>
        {company && company.practiceRounds > 0 ? (
          <>
            Your course starts with{" "}
            <strong>
              {company.practiceRounds} practice round
              {company.practiceRounds === 1 ? "" : "s"}
            </strong>{" "}
            to learn the system, followed by{" "}
            <strong>
              {company.competitiveRounds} competitive round
              {company.competitiveRounds === 1 ? "" : "s"}
            </strong>
            .{" "}
          </>
        ) : null}
        There is no single right answer: strong teams make coherent choices,
        explain their reasoning, and learn from each round&apos;s results.
      </Callout>
    </>
  );
}

/* ------------------------------------------------- 3. The round cycle -- */

export function RoundStep() {
  const cycle = [
    {
      who: "Instructor",
      icon: CalendarClock,
      title: "The round opens",
      text: "Each round has an economy condition (boom, normal or recession) and usually a deadline.",
    },
    {
      who: "Your team",
      icon: Users,
      title: "Analyze and plan",
      text: "Review your company brief, last round's results and the feedback before deciding.",
    },
    {
      who: "Your team",
      icon: ClipboardList,
      title: "Make decisions in seven HR areas",
      text: "Your team shares one set of decisions and one HR budget.",
    },
    {
      who: "Your team",
      icon: FileCheck2,
      title: "Review and submit — once",
      text: "After your team submits, the round's decisions are locked.",
    },
    {
      who: "Instructor",
      icon: BarChart3,
      title: "The round closes and is scored",
      text: "Every team is scored. Your results appear in the Workforce Brief.",
    },
    {
      who: "Your team",
      icon: MessageSquare,
      title: "Reflect and improve",
      text: "Write a short reflection, then use what you learned in the next round.",
    },
  ];
  return (
    <>
      <p>The simulation runs in rounds. Every round follows the same cycle:</p>
      <ol>
        {cycle.map((c, i) => {
          const Icon = c.icon;
          const instructor = c.who === "Instructor";
          return (
            <li key={c.title} className="relative flex gap-3 pb-4 last:pb-0">
              {i < cycle.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute left-[1.0625rem] top-9 h-[calc(100%-2.25rem)] w-0.5 bg-[var(--portal-sidebar-border)]"
                />
              ) : null}
              <span
                className={`relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  instructor
                    ? "bg-[var(--portal-navy)] text-white"
                    : "bg-[var(--portal-primary-soft)] text-[var(--portal-primary)]"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 pt-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-[var(--portal-title)]">
                    {i + 1}. {c.title}
                  </p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[0.6875rem] font-bold ${
                      instructor
                        ? "bg-[var(--portal-navy)] text-white"
                        : "bg-[var(--portal-primary-soft)] text-[var(--portal-primary)]"
                    }`}
                  >
                    {c.who}
                  </span>
                </div>
                <p className="text-sm text-[var(--portal-muted)]">{c.text}</p>
              </div>
            </li>
          );
        })}
      </ol>
      <Callout tone="orange">
        <strong>Rounds build on each other.</strong> The workforce you build,
        the people you lose and the money you spend all carry into the next
        round.
      </Callout>
    </>
  );
}

/* ------------------------------------------- 4. The seven HR decisions -- */

/** DECISION_TABS key → MODULE_SCAFFOLDING key, plus what the area covers. */
const AREA_DETAILS: Record<
  string,
  { scaffolding: string; decide: string[]; moves: string[] }
> = {
  recruitment: {
    scaffolding: "Recruitment",
    decide: ["Roles to fill", "Screening rigor", "Diversity sourcing", "Onboarding"],
    moves: ["Cost per hire", "Time to fill", "Hiring quality"],
  },
  performance: {
    scaffolding: "Performance",
    decide: ["Review cadence", "360° feedback", "Role-level criteria"],
    moves: ["Review coverage", "Succession pipeline", "Productivity"],
  },
  training: {
    scaffolding: "Training",
    decide: ["Budget per employee", "Coverage", "Development programs"],
    moves: ["Training ROI", "Training effectiveness", "Productivity"],
  },
  relations: {
    scaffolding: "Relations",
    decide: ["Conflict approach", "Employee voice", "Engagement spend", "Flexibility"],
    moves: ["Satisfaction", "Engagement", "Absenteeism", "DEI outcomes"],
  },
  compensation: {
    scaffolding: "Compensation",
    decide: ["Salary bands", "Bonus tier", "Benefits", "Equity", "HR technology"],
    moves: ["Turnover", "Retention", "Financial results"],
  },
  "org-design": {
    scaffolding: "Org Design",
    decide: ["Structure", "Span of control", "Process focus", "Change capability", "Collaboration"],
    moves: [],
  },
  dei: {
    scaffolding: "DEI",
    decide: ["Talent pipelines", "Equity", "Inclusion", "Education", "Accessibility"],
    moves: ["DEI score"],
  },
};

export function DecisionsStep() {
  const [selected, setSelected] = useState<string>(DECISION_TABS[0].key);
  const [seen, setSeen] = useState<string[]>([DECISION_TABS[0].key]);

  const tab = DECISION_TABS.find((t) => t.key === selected) ?? DECISION_TABS[0];
  const detail = AREA_DETAILS[tab.key];
  const Icon = tab.icon;

  function select(key: string) {
    setSelected(key);
    setSeen((s) => (s.includes(key) ? s : [...s, key]));
  }

  return (
    <>
      <p>
        Each round your team makes decisions in seven connected HR areas. A
        choice in one area affects others — for example, pay affects turnover,
        which affects hiring costs. <strong>Select each area</strong> to see
        what you decide there.
      </p>

      <div className="grid gap-3 md:grid-cols-[230px_minmax(0,1fr)]">
        <div
          role="tablist"
          aria-label="HR decision areas"
          aria-orientation="vertical"
          className="flex gap-1.5 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:pb-0"
        >
          {DECISION_TABS.map((t, i) => {
            const TabIcon = t.icon;
            const isSelected = t.key === selected;
            const wasSeen = seen.includes(t.key);
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => select(t.key)}
                className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm md:w-full ${
                  isSelected
                    ? "border-[var(--portal-brand)] bg-[var(--portal-brand-soft)] font-bold text-[var(--portal-brand)]"
                    : "border-[var(--portal-sidebar-border)] bg-white font-medium text-[var(--portal-ink)] hover:border-[var(--portal-brand)]/40"
                }`}
              >
                <TabIcon className="h-4 w-4 shrink-0" />
                <span className="min-w-0 flex-1 whitespace-nowrap md:whitespace-normal">
                  {i + 1}. {t.label}
                </span>
                {wasSeen && !isSelected ? (
                  <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                ) : null}
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          aria-label={tab.label}
          className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4"
        >
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--portal-primary-soft)] text-[var(--portal-primary)]">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-lg font-bold leading-tight text-[var(--portal-title)]">
                {tab.label}
              </h3>
              <p className="mt-1 inline-block rounded-full bg-[var(--portal-brand-soft)] px-2 py-0.5 text-[0.6875rem] font-bold text-[var(--portal-brand)]">
                SHRM BASK · {tab.shrm}
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm text-[var(--portal-ink)]">
            {MODULE_SCAFFOLDING[detail.scaffolding]}
          </p>
          <ChipRow label="You decide" items={detail.decide} tone="blue" />
          {detail.moves.length > 0 ? (
            <ChipRow label="It moves" items={detail.moves} tone="green" />
          ) : null}
        </div>
      </div>

      <p className="text-xs text-[var(--portal-muted)]" aria-live="polite">
        {seen.length} of {DECISION_TABS.length} areas viewed
      </p>

      <Callout>
        <strong>Spending more is not automatically better.</strong> The
        scorecard rewards choices that fit your strategy and stay within
        budget.
      </Callout>
    </>
  );
}

function ChipRow({
  label,
  items,
  tone,
}: {
  label: string;
  items: string[];
  tone: "blue" | "green";
}) {
  const chip =
    tone === "green"
      ? "bg-emerald-50 text-emerald-800"
      : "bg-[var(--portal-primary-soft)] text-[var(--portal-primary)]";
  return (
    <div className="mt-3">
      <p className="text-[0.6875rem] font-bold uppercase tracking-wide text-[var(--portal-muted)]">
        {label}
      </p>
      <ul className="mt-1 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <li
            key={item}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${chip}`}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ----------------------------------------------------- 6. Results -- */

export function ResultsStep() {
  const items = [
    {
      icon: FileCheck2,
      title: "Review & Submit",
      where: "Left menu › Review & Submit",
      text: "See your full plan, budget use, warnings and recommendations. Fix what you need, then submit as a team. After submitting, the round's decisions can't be edited.",
    },
    {
      icon: FileText,
      title: "The Workforce Brief",
      where: "Reports & HR Analytics › The Workforce Brief",
      text: "After the round closes: your Balanced Scorecard score, strategic KPIs, workforce metrics and feedback on what worked.",
    },
    {
      icon: BarChart3,
      title: "Financial reports",
      where: "Reports & HR Analytics",
      text: "Balance sheet, profit & loss, cash flow and financial ratios show the money side of your HR decisions.",
    },
    {
      icon: MessageSquare,
      title: "Team reflection",
      where: "Bottom of the Workforce Brief",
      text: "Explain your decisions and what you learned (100–2,000 characters). Your instructor reads these.",
    },
    {
      icon: Trophy,
      title: "Leaderboard",
      where: "Dashboard › View Leaderboard",
      text: "When your instructor releases it, see how your company ranks against the class.",
    },
  ];
  return (
    <>
      <p>After your decisions, here is where you go next and where to find it:</p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((it, i) => {
          const Icon = it.icon;
          return (
            <li
              key={it.title}
              className={`rounded-xl border border-[var(--portal-sidebar-border)] bg-white px-4 py-3 ${
                i === 0 ? "sm:col-span-2" : ""
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--portal-primary-soft)] text-[var(--portal-primary)]">
                  <Icon className="h-4 w-4" />
                </span>
                <p className="font-bold text-[var(--portal-title)]">{it.title}</p>
              </div>
              <p className="mt-2 text-sm text-[var(--portal-muted)]">{it.text}</p>
              <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#f1f3f6] px-2.5 py-1 text-xs font-semibold text-[var(--portal-title)]">
                <MapPin className="h-3 w-3" />
                {it.where}
              </p>
            </li>
          );
        })}
      </ul>
      <Callout tone="orange">
        <strong>Submit before the deadline.</strong>{" "}
        If your team doesn&apos;t
        submit before the instructor closes the round, it isn&apos;t scored for
        that round.
      </Callout>
    </>
  );
}

/* ------------------------------------------------------- 7. Ready -- */

export function ReadyStep({ company }: { company: TutorialCompany | null }) {
  const plan = company
    ? [
        "Read the Industry & Strategy Brief with your team",
        "Agree on your team's priorities for the first round",
        "Make decisions in all seven HR areas",
        "Review & Submit before the deadline",
        "Read your Workforce Brief and write your reflection",
      ]
    : [
        "Join your team with the code from your instructor",
        "Replay this orientation to see your own company's situation",
        "Read the Industry & Strategy Brief with your team",
        "Make decisions, then Review & Submit before the deadline",
      ];
  return (
    <>
      <p>
        {company ? (
          <>
            That&apos;s the essentials. Here is a good first-round plan for{" "}
            <strong>{company.name}</strong>:
          </>
        ) : (
          <>That&apos;s the essentials. Here is a good way to start:</>
        )}
      </p>
      <ol className="space-y-2">
        {plan.map((item, i) => (
          <li key={item} className="flex items-start gap-3">
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--portal-primary)] text-xs font-bold text-[var(--portal-primary)]">
              {i + 1}
            </span>
            {item}
          </li>
        ))}
      </ol>
      <div className="grid gap-3 sm:grid-cols-2">
        <Callout>
          <p className="flex items-center gap-1.5 font-bold text-[var(--portal-title)]">
            <Monitor className="h-4 w-4" /> Want to experiment first?
          </p>
          <p className="mt-1">
            The <strong>Simulator</strong> link in the top bar lets you try
            decisions without affecting your team.
          </p>
        </Callout>
        <Callout>
          <p className="flex items-center gap-1.5 font-bold text-[var(--portal-title)]">
            <RotateCcw className="h-4 w-4" /> Need a refresher later?
          </p>
          <p className="mt-1">
            Replay this orientation from <strong>Getting Started</strong> or
            the <strong>Help Center</strong>.
          </p>
        </Callout>
      </div>
    </>
  );
}
