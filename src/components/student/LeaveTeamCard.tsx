"use client";

import { LogOut, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { LeaveEligibility } from "@/lib/student/leave-team";

/**
 * "Leave team" on the team members page.
 *
 * Two-step on purpose: leaving drops the student back to /join with no
 * undo, and the join code they mistyped to get here is exactly the kind of
 * slip a single-click control repeats.
 */
export function LeaveTeamCard({
  teamName,
  eligibility,
}: {
  teamName: string;
  eligibility: LeaveEligibility;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLeave() {
    setLeaving(true);
    setError(null);
    try {
      const res = await fetch("/api/teams/leave", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not leave the team. Try again.");
        setLeaving(false);
        setConfirming(false);
        return;
      }
      router.push("/join");
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection.");
      setLeaving(false);
    }
  }

  return (
    <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
      <div className="flex items-start gap-2.5">
        <LogOut className="mt-0.5 h-4 w-4 text-[var(--portal-muted)]" />
        <div className="w-full">
          <h2 className="text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--portal-title)]">
            Leave Team
          </h2>

          {!eligibility.allowed ? (
            <p className="mt-2 text-sm leading-relaxed text-[var(--portal-muted)]">
              {eligibility.message}
            </p>
          ) : (
            <>
              <p className="mt-2 text-sm leading-relaxed text-[var(--portal-muted)]">
                Joined the wrong team? You can leave {teamName} and enter a
                different join code. Your team&apos;s work stays with the team.
              </p>

              {error && (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
                  {error}
                </p>
              )}

              {!confirming ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => setConfirming(true)}
                >
                  Leave this team
                </Button>
              ) : (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="flex items-start gap-2 text-sm text-amber-950">
                    <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      Leave {teamName}? You will need a join code to get back
                      in, and your teammates are not notified.
                    </span>
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-red-600 text-white hover:bg-red-700"
                      disabled={leaving}
                      onClick={handleLeave}
                    >
                      {leaving ? "Leaving…" : "Yes, leave"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      disabled={leaving}
                      onClick={() => setConfirming(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
