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
        <p className="text-sm text-[#6b7280]">
          <Link href="/join" className="text-[#e67e22] hover:underline">
            Join a team
          </Link>{" "}
          to view instructor information.
        </p>
      ) : (
        <section className="rounded-xl border border-[#dde1e6] bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-[#0f172a]">Instructor Information</h2>
          <p className="mt-3 text-sm text-[#1f2937]">
            <span className="text-[#6b7280]">Instructor: </span>
            <span className="font-semibold">
              {ctx.instructor?.display_name ?? "—"}
            </span>
          </p>
          <p className="mt-2 text-sm text-[#1f2937]">
            <span className="text-[#6b7280]">Course: </span>
            <span className="font-semibold">{ctx.team.sessions.name}</span>
            {ctx.team.sessions.course_code
              ? ` (${ctx.team.sessions.course_code})`
              : ""}
          </p>
          {ctx.team.sessions.announcement ? (
            <div className="mt-4 rounded-lg bg-[#fff4e8] px-3 py-2 text-sm text-[#1f2937]">
              <p className="text-xs font-bold uppercase tracking-wide text-[#e67e22]">
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
