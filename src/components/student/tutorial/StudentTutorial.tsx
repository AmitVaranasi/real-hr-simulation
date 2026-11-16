"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Building2,
  CalendarClock,
  Check,
  ClipboardList,
  Flag,
  MousePointerClick,
  Target,
  X,
} from "lucide-react";
import { DecisionPageTour } from "@/components/student/tutorial/DecisionPageTour";
import {
  CaseStep,
  DecisionsStep,
  GoalStep,
  ReadyStep,
  ResultsStep,
  RoundStep,
  type TutorialCompany,
} from "@/components/student/tutorial/tutorial-steps";
import { createClient } from "@/lib/supabase/client";
import {
  TUTORIAL_STATUS_KEY,
  TUTORIAL_UPDATED_KEY,
  type TutorialStatus,
} from "@/lib/student/tutorial";

export type { TutorialCompany };

const STEPS = [
  { title: "Your company and your role", short: "The case", icon: Building2 },
  { title: "What you are trying to accomplish", short: "Your goal", icon: Target },
  { title: "How each round works", short: "The round cycle", icon: CalendarClock },
  { title: "The seven HR decisions", short: "HR decisions", icon: ClipboardList },
  { title: "Using the decision page", short: "Page controls", icon: MousePointerClick },
  { title: "Submitting and reading results", short: "Results", icon: BarChart3 },
  { title: "You are ready", short: "Get started", icon: Flag },
] as const;

export function StudentTutorial({
  company,
  replay,
  next,
}: {
  company: TutorialCompany | null;
  /** The student already finished or skipped it once. */
  replay: boolean;
  next: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const [confirmSkip, setConfirmSkip] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  const last = step === STEPS.length - 1;

  const go = useCallback((to: number) => {
    if (to < 0 || to >= STEPS.length) return;
    moved.current = true;
    setStep(to);
    setFurthest((f) => Math.max(f, to));
  }, []);

  // After a step change, start reading from the new heading (keyboard and
  // screen-reader users would otherwise stay on the Next button).
  useEffect(() => {
    if (!moved.current) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
    headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  // ← / → move between steps, except while using a form control.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (confirmSkip || e.altKey || e.ctrlKey || e.metaKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight") go(step + 1);
      if (e.key === "ArrowLeft") go(step - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmSkip, go, step]);

  async function finish(status: TutorialStatus) {
    setSaving(true);
    setError(null);
    // Replaying never downgrades a completed orientation to "skipped".
    if (!(replay && status === "skipped")) {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          [TUTORIAL_STATUS_KEY]: status,
          [TUTORIAL_UPDATED_KEY]: new Date().toISOString(),
        },
      });
      if (updateError) {
        setSaving(false);
        setConfirmSkip(false);
        setError("We couldn't save your progress. Please try again.");
        return;
      }
    }
    router.replace(next);
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[var(--portal-page)]">
      <header className="sticky top-0 z-20 border-b border-[var(--portal-sidebar-border)] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="text-lg font-bold text-[var(--portal-brand)]">
              Real HR Simulation
            </p>
            <p className="truncate text-xs font-semibold text-[var(--portal-muted)]">
              Student Orientation · Step {step + 1} of {STEPS.length}
              <span className="lg:hidden"> · {STEPS[step].short}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => (replay ? finish("skipped") : setConfirmSkip(true))}
            disabled={saving}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--portal-sidebar-border)] px-3 py-1.5 text-sm font-semibold text-[var(--portal-ink)] hover:bg-[#f8fafc] disabled:opacity-50"
          >
            <X className="h-4 w-4" />
            {replay ? "Exit orientation" : "Skip orientation"}
          </button>
        </div>
        <div
          role="progressbar"
          aria-label="Orientation progress"
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuenow={step + 1}
          className="h-1 bg-[#eef1f4]"
        >
          <div
            className="h-full bg-[var(--portal-primary)] transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav aria-label="Orientation steps" className="hidden lg:block">
          <ol className="sticky top-24 space-y-1">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const done = i !== step && i <= furthest;
              const reachable = i <= furthest;
              return (
                <li key={s.title}>
                  <button
                    type="button"
                    disabled={!reachable}
                    onClick={() => go(i)}
                    aria-current={i === step ? "step" : undefined}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm ${
                      i === step
                        ? "bg-white font-bold text-[var(--portal-primary)] shadow-sm"
                        : reachable
                          ? "font-medium text-[var(--portal-ink)] hover:bg-white"
                          : "font-medium text-[var(--portal-muted)]"
                    }`}
                  >
                    <span
                      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
                        done
                          ? "bg-emerald-600 text-white"
                          : i === step
                            ? "bg-[var(--portal-primary)] text-white"
                            : "bg-[#e6e9ee] text-[var(--portal-muted)]"
                      }`}
                    >
                      {done ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Icon className="h-3.5 w-3.5" />
                      )}
                    </span>
                    {s.short}
                  </button>
                </li>
              );
            })}
            <li className="px-3 pt-3 text-xs leading-relaxed text-[var(--portal-muted)]">
              About 5 minutes. Use ← → to move between steps. You can replay
              this any time from Getting Started or the Help Center.
            </li>
          </ol>
        </nav>

        <main className="min-w-0">
          <section className="rounded-2xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm sm:p-7">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--portal-primary)]">
              Step {step + 1} · {STEPS[step].short}
            </p>
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="mt-1 text-2xl font-bold text-[var(--portal-title)] outline-none sm:text-[1.75rem]"
            >
              {STEPS[step].title}
            </h1>
            <div className="mt-5 space-y-5 text-[0.9375rem] leading-relaxed text-[var(--portal-ink)]">
              {step === 0 ? <CaseStep company={company} /> : null}
              {step === 1 ? <GoalStep company={company} /> : null}
              {step === 2 ? <RoundStep /> : null}
              {step === 3 ? <DecisionsStep /> : null}
              {step === 4 ? (
                <>
                  <p>
                    You&apos;ll spend most of your time on the{" "}
                    <strong>HR Decisions</strong> page. This is a small working
                    copy of it — change the inputs and select each number to
                    see what that part does.
                  </p>
                  <DecisionPageTour />
                  <p className="text-sm text-[var(--portal-muted)]">
                    On the real page, switch between the seven areas from{" "}
                    <strong>HR Decisions</strong> in the left menu. Your whole
                    team edits the <strong>same</strong> set of decisions, so
                    agree on who changes what before you start.
                  </p>
                </>
              ) : null}
              {step === 5 ? <ResultsStep /> : null}
              {step === 6 ? <ReadyStep company={company} /> : null}
            </div>

            {error ? (
              <p role="alert" className="mt-5 text-sm font-semibold text-red-600">
                {error}
              </p>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--portal-sidebar-border)] pt-5">
              <button
                type="button"
                onClick={() => go(step - 1)}
                disabled={step === 0 || saving}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-[var(--portal-ink)] hover:bg-[#f8fafc] disabled:invisible"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              {last ? (
                <button
                  type="button"
                  onClick={() => finish("completed")}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-[var(--portal-brand)] px-5 py-2.5 text-sm font-bold text-white hover:bg-[var(--portal-brand-hover)] disabled:opacity-60"
                >
                  {saving
                    ? "Opening the portal…"
                    : replay
                      ? "Finish and return to the portal"
                      : "Finish and enter the portal"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => go(step + 1)}
                  className="inline-flex items-center gap-2 rounded-lg bg-[var(--portal-primary)] px-5 py-2.5 text-sm font-bold text-white hover:bg-[var(--portal-primary-hover)]"
                >
                  Next: {STEPS[step + 1].short}
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </section>
        </main>
      </div>

      {confirmSkip ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="skip-title"
          onKeyDown={(e) => {
            if (e.key === "Escape") setConfirmSkip(false);
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmSkip(false);
          }}
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2
              id="skip-title"
              className="text-lg font-bold text-[var(--portal-title)]"
            >
              Skip the orientation?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--portal-muted)]">
              It takes about 5 minutes and explains your company&apos;s
              situation, what your team is trying to accomplish, and how to use
              the decision pages. You can replay it any time from{" "}
              <strong>Getting Started</strong> or the{" "}
              <strong>Help Center</strong>.
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => finish("skipped")}
                disabled={saving}
                className="rounded-lg border border-[var(--portal-sidebar-border)] px-4 py-2 text-sm font-semibold text-[var(--portal-ink)] hover:bg-[#f8fafc] disabled:opacity-50"
              >
                {saving ? "Skipping…" : "Skip for now"}
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => setConfirmSkip(false)}
                className="rounded-lg bg-[var(--portal-primary)] px-4 py-2 text-sm font-bold text-white hover:bg-[var(--portal-primary-hover)]"
              >
                Continue the orientation
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
