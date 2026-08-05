import Link from "next/link";
import {
  SimulationContextStrip,
  StudentPageHeader,
} from "@/components/student/shell/StudentShell";
import { TeamSubnav } from "@/components/student/TeamSubnav";
import { getStudentTeamContext } from "@/lib/student/team-context";

export default async function IndustryStrategyPage() {
  const ctx = await getStudentTeamContext();
  return (
    <div>
      <StudentPageHeader
        title="Team & Company"
        subtitle="Understand your industry environment, competitive landscape, and strategic priorities before making HR decisions."
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
      <TeamSubnav activeHref="/team/industry-strategy" />
      {!ctx.team ? (
        <p className="text-sm text-[#6b7280]">
          <Link href="/join" className="text-[#e67e22] hover:underline">
            Join a team
          </Link>{" "}
          to view your industry and strategy brief.
        </p>
      ) : (
        <div className="space-y-4">
          <section className="rounded-xl border border-[#dde1e6] bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-[#0f172a]">Industry</h2>
            <p className="mt-2 text-lg font-bold text-[#e67e22]">
              {ctx.team.industry ?? "—"}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#6b7280]">
              Your HR decisions should make sense for this industry&apos;s operating
              environment, talent markets, and workforce expectations. Use this
              context when allocating discretionary budget and designing HR systems.
            </p>
          </section>
          <section className="rounded-xl border border-[#dde1e6] bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-[#0f172a]">Strategy</h2>
            <p className="mt-2 text-lg font-bold text-[#e67e22]">
              {ctx.team.strategy ?? "—"}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#6b7280]">
              Align recruitment, performance, development, relations, compensation,
              organization design, and DEI choices with how your company competes.
              Deeper instructional content will expand here as Learning Guide materials
              are finalized.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
