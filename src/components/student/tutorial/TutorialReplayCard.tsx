import Link from "next/link";
import { GraduationCap, RotateCcw } from "lucide-react";
import { TUTORIAL_PATH, type TutorialStatus } from "@/lib/student/tutorial";

/**
 * Entry point back into the student orientation. `reminder` is the stronger
 * dashboard prompt shown to students who skipped it.
 */
export function TutorialReplayCard({
  status,
  returnTo,
  variant = "default",
}: {
  status: TutorialStatus | null;
  returnTo: string;
  variant?: "default" | "reminder";
}) {
  const href = `${TUTORIAL_PATH}?next=${encodeURIComponent(returnTo)}`;
  const reminder = variant === "reminder";

  return (
    <section
      className={`mb-4 flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
        reminder
          ? "border-[var(--portal-brand)]/30 bg-[var(--portal-brand-soft)]"
          : "border-[var(--portal-primary)]/20 bg-[var(--portal-primary-soft)]"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[var(--portal-primary)]">
          <GraduationCap className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-bold text-[var(--portal-title)]">
            {reminder
              ? "You skipped the student orientation"
              : "Student orientation"}
          </p>
          <p className="text-xs text-[var(--portal-muted)]">
            {reminder
              ? "Take 5 minutes to learn your company's situation, your goal, and how the decision pages work."
              : "Your company's situation, what your team is trying to accomplish, the seven HR decisions, and how the portal works."}
          </p>
        </div>
      </div>
      <Link
        href={href}
        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[var(--portal-primary)] px-3.5 py-2 text-sm font-bold text-white hover:bg-[var(--portal-primary-hover)]"
      >
        <RotateCcw className="h-4 w-4" />
        {status === "completed" ? "Replay orientation" : "Start orientation"}
      </Link>
    </section>
  );
}
