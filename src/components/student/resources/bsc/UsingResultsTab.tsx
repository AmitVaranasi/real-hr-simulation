"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import {
  BarChart3,
  CircleHelp,
  ClipboardList,
  Gauge,
  Info,
  LayoutGrid,
  Lightbulb,
  Link2,
  MessageSquare,
  NotebookPen,
  RefreshCw,
  Search,
  Target,
  type LucideIcon,
} from "lucide-react";
import {
  Callout,
  KeyTakeaway,
  Panel,
  SectionTitle,
  StepFlow,
} from "@/components/student/resources/bsc/BscParts";

/** Section names as they appear in the student Workforce Brief. */
const BRIEF_SECTIONS: Array<{ name: string; tells: string; icon: LucideIcon; note?: string }> = [
  {
    name: "HR Balance Scorecard",
    tells: "Your overall HR performance across the four perspectives.",
    icon: Gauge,
  },
  {
    name: "Strategic Performance Metrics KPIs",
    tells: "High-level business results such as revenue, profit, and market share. Reported separately from the scorecard.",
    icon: BarChart3,
  },
  {
    name: "Perspective Summaries",
    tells: "A brief assessment of your Financial, Employee, Internal Process, and Learning & Growth results.",
    icon: LayoutGrid,
  },
  {
    name: "Workforce Performance Metrics",
    tells: "Detailed HR metrics such as cost per hire, turnover, and engagement.",
    icon: ClipboardList,
  },
  {
    name: "HR Coach",
    tells: "Targeted insights and suggestions for improvement.",
    icon: MessageSquare,
    note: "Coming soon",
  },
  {
    name: "Team Reflection",
    tells: "Your team's own explanation of its reasoning and plan for the next round.",
    icon: NotebookPen,
  },
];

const QUESTIONS = [
  "Which BSC perspective was your strongest? Why do you think so?",
  "Which perspective needs improvement? What might be causing that?",
  "How did your HR decisions influence key metrics (e.g., turnover, training ROI)?",
  "Are your results aligned with your industry, strategy, and economic conditions?",
  "What will you do differently in the next round based on these results?",
  "If you were the HR manager presenting these results to senior leadership, what recommendation would you make, and what evidence would you use to support it?",
];

const STORAGE_KEY = "bsc-reference-questions";
const STORAGE_EVENT = "bsc-reference-questions-change";

function readSaved(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "[]";
  } catch {
    // Storage unavailable (private window, blocked site data).
    return "[]";
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(STORAGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(STORAGE_EVENT, onChange);
  };
}

/** Personal reminders only: kept in this browser and never sent or graded. */
function useCheckedQuestions() {
  const raw = useSyncExternalStore(subscribe, readSaved, () => "[]");
  let saved: unknown = [];
  try {
    saved = JSON.parse(raw);
  } catch {
    saved = [];
  }
  const checked = QUESTIONS.map(
    (_, i) => Array.isArray(saved) && saved[i] === true
  );
  function toggle(i: number) {
    const next = checked.map((v, j) => (j === i ? !v : v));
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore: nothing to keep without storage.
    }
    window.dispatchEvent(new Event(STORAGE_EVENT));
  }
  return { checked, toggle };
}

export function UsingResultsTab() {
  const { checked, toggle } = useCheckedQuestions();
  return (
    <>
      <SectionTitle
        title="Using the Results"
        subtitle="Learn how to interpret your HR Balance Scorecard results, connect them to your decisions, and act to improve performance in the next round."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Callout title="What You'll Learn on This Page" icon={Info}>
          How to read your results, identify what&apos;s working and what&apos;s
          not, and use the insights to adjust your HR strategy.
        </Callout>
        <Callout title="The Goal" icon={Target} tone="amber">
          Turn your simulation results into learning and better decisions, not
          just a score.
        </Callout>
      </div>

      <div>
        <SectionTitle title="Step-by-Step: From Results to Action" />
        <div className="mt-3">
          <StepFlow
            steps={[
              {
                title: "Review Your Results",
                body: "Examine your HR Balance Scorecard, key metrics, and perspective summaries.",
                icon: Search,
              },
              {
                title: "Identify Insights",
                body: "Look for strengths, weaknesses, and notable changes from the prior round.",
                icon: BarChart3,
                tone: "employee",
              },
              {
                title: "Connect to Your Decisions",
                body: "Examine which HR decisions may have contributed to changes in your metrics and BSC scores. Consider other organizational and environmental factors before drawing conclusions.",
                icon: Link2,
                tone: "process",
              },
              {
                title: "Adjust Your Strategy",
                body: "Use the insights to refine your HR actions (e.g., hiring, training, compensation, DEI) for the next round.",
                icon: ClipboardList,
                tone: "learning",
              },
              {
                title: "Track Progress",
                body: "Compare results across rounds to see how your changes affect overall performance.",
                icon: RefreshCw,
              },
            ]}
          />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel>
          <SectionTitle
            icon={BarChart3}
            title="Reading Your Workforce Brief Results"
            subtitle="Your Workforce Brief reports the results of each completed round. Key areas to review and what they tell you:"
          />
          <ul className="mt-3 divide-y divide-[var(--portal-sidebar-border)]">
            {BRIEF_SECTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <li key={s.name} className="grid gap-1 py-2.5 text-sm sm:grid-cols-[210px_minmax(0,1fr)]">
                  <span className="flex items-center gap-2 font-semibold text-[var(--portal-title)]">
                    <Icon className="h-4 w-4 shrink-0 text-[var(--portal-primary)]" aria-hidden />
                    {s.name}
                    {s.note ? (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.625rem] font-bold uppercase text-[var(--portal-muted)]">
                        {s.note}
                      </span>
                    ) : null}
                  </span>
                  <span className="text-[var(--portal-ink)]">{s.tells}</span>
                </li>
              );
            })}
          </ul>
          <Link
            href="/reports/workforce-brief"
            className="mt-3 inline-flex text-sm font-semibold text-[var(--portal-primary)] hover:underline"
          >
            Open your Workforce Brief →
          </Link>
        </Panel>

        <Panel>
          <SectionTitle icon={CircleHelp} title="Questions to Guide Your Analysis" />
          <ul className="mt-3 space-y-2.5">
            {QUESTIONS.map((q, i) => (
              <li key={q}>
                <label className="flex cursor-pointer items-start gap-2.5 text-sm text-[var(--portal-ink)]">
                  <input
                    type="checkbox"
                    checked={checked[i]}
                    onChange={() => toggle(i)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--portal-primary)]"
                  />
                  <span>{q}</span>
                </label>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-[var(--portal-muted)]">
            The checkboxes are personal reminders. They are saved only in this
            browser and are not shared or graded.
          </p>
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Callout title="Example Insight" icon={Lightbulb} tone="green">
          If your Employee Perspective improves after increasing investment in
          Training &amp; Development, the results may suggest that your investment
          is contributing to stronger employee engagement and satisfaction.
          However, a responsible HR professional would also examine other
          workforce metrics, organizational conditions, and previous decisions
          before concluding that training caused the improvement.
        </Callout>
        <KeyTakeaway>
          Use your results as a learning loop: review, interpret, reflect,
          adjust, and improve. The HR Balance Scorecard is more than a
          performance report. It is a tool for developing the judgment,
          accountability, and strategic thinking expected of HR professionals.
          Each round is an opportunity to make better decisions and strengthen
          how you think as an emerging HR leader.
        </KeyTakeaway>
      </div>
    </>
  );
}
