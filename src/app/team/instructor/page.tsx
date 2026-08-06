import Link from "next/link";
import {
  SimulationContextStrip,
  StudentPageHeader,
} from "@/components/student/shell/StudentShell";
import { TeamSubnav } from "@/components/student/TeamSubnav";
import { getStudentTeamContext } from "@/lib/student/team-context";

export default async function InstructorInfoPage() {
  const ctx = await getStudentTeamContext();
  return (
    <div>
      <StudentPageHeader
        title="Team & Company"
        subtitle="Know who is facilitating your simulation session."
      />
      <SimulationContextStrip
        items={[
          ctx.openRound
            ? `Round ${ctx.openRound.round_number} – OPEN`
            : "No open round",
          ctx.team?.sessions.name,
        ]}
      />
      <TeamSubnav activeHref="/team/instructor" />
      {!ctx.team ? (
        <p className="text-sm text-[var(--portal-muted)]">
          <Link href="/join" className="text-[var(--portal-primary)] hover:underline">
            Join a team
          </Link>{" "}
          to view instructor information.
        </p>
      ) : (
        <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-[var(--portal-title)]">Instructor Information</h2>
          <p className="mt-3 text-sm text-[var(--portal-ink)]">
            <span className="text-[var(--portal-muted)]">Instructor: </span>
            <span className="font-semibold">
              {ctx.instructor?.display_name ?? "—"}
            </span>
          </p>
          <p className="mt-2 text-sm text-[var(--portal-ink)]">
            <span className="text-[var(--portal-muted)]">Course: </span>
            <span className="font-semibold">{ctx.team.sessions.name}</span>
            {ctx.team.sessions.course_code
              ? ` (${ctx.team.sessions.course_code})`
              : ""}
          </p>
          {ctx.team.sessions.announcement ? (
            <div className="mt-4 rounded-lg bg-[var(--portal-primary-soft)] px-3 py-2 text-sm text-[var(--portal-ink)]">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--portal-primary)]">
                Announcement
              </p>
              <p className="mt-1 whitespace-pre-wrap">
                {ctx.team.sessions.announcement}
              </p>
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
}
