import Link from "next/link";
import {
  SimulationContextStrip,
  StudentPageHeader,
} from "@/components/student/shell/StudentShell";
import { TeamSubnav } from "@/components/student/TeamSubnav";
import { getStudentTeamContext } from "@/lib/student/team-context";

export default async function TeamMembersPage() {
  const ctx = await getStudentTeamContext();
  return (
    <div>
      <StudentPageHeader
        title="Team & Company"
        subtitle="Confirm who is on your company team and how you will collaborate."
      />
      <SimulationContextStrip
        items={[
          ctx.openRound
            ? `Round ${ctx.openRound.round_number} – OPEN`
            : "No open round",
          ctx.team?.industry,
          ctx.team?.strategy,
        ]}
      />
      <TeamSubnav activeHref="/team/members" />
      {!ctx.team ? (
        <p className="text-sm text-[var(--portal-muted)]">
          <Link href="/join" className="text-[var(--portal-primary)] hover:underline">
            Join a team
          </Link>{" "}
          to see teammates.
        </p>
      ) : (
        <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-[var(--portal-title)]">My Team — {ctx.team.name}</h2>
          <ul className="mt-4 space-y-2">
            {ctx.members.map((m, i) => (
              <li
                key={`${m.display_name}-${i}`}
                className="rounded-lg border border-[#f0f1f3] bg-[#f8fafc] px-3 py-2 text-sm text-[var(--portal-ink)]"
              >
                {m.display_name}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm">
            <Link href="/join" className="font-medium text-[var(--portal-primary)] hover:underline">
              Join a different session →
            </Link>
          </p>
        </section>
      )}
    </div>
  );
}
