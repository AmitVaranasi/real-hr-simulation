import Link from "next/link";
import { BarChart3, Check, Info, Lightbulb, Mail, MessageSquare } from "lucide-react";
import { TeamPageShell, formatJoinedDate, nameInitials } from "@/components/student/TeamChrome";
import { getStudentTeamContext } from "@/lib/student/team-context";

const TEAM_TIPS = [
  "Discuss your strategy before making major decisions.",
  "Review all decisions together in Review & Submit.",
  "Ensure your budget stays within recommended ranges.",
  "Submit your decisions before the round due date.",
];

export default async function TeamMembersPage() {
  const ctx = await getStudentTeamContext();

  return (
    <TeamPageShell ctx={ctx} activeHref="/team/members">
      {!ctx.team ? (
        <p className="text-sm text-[var(--portal-muted)]">
          <Link href="/join" className="text-[var(--portal-primary)] hover:underline">
            Join a team
          </Link>{" "}
          to see teammates.
        </p>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_var(--portal-right-rail)]">
          <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
              <div>
                <h2 className="text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--portal-title)]">
                  Your Team Members
                </h2>
                <p className="mt-1 text-sm text-[var(--portal-muted)]">
                  These are the members of your simulation team.
                </p>
              </div>
              <Link
                href="/team"
                className="inline-flex items-center gap-1.5 rounded-md border border-[var(--portal-accent-blue)] px-3 py-1.5 text-xs font-semibold text-[var(--portal-accent-blue)] hover:bg-[var(--portal-accent-blue-soft)]"
              >
                <BarChart3 className="h-3.5 w-3.5" strokeWidth={1.75} />
                Team Overview
              </Link>
            </div>

            <div className="mt-4 overflow-x-auto px-5">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--portal-sidebar-border)] text-[0.625rem] font-bold uppercase tracking-wide text-[var(--portal-muted)]">
                    <th className="pb-2 pr-3 font-bold">Member</th>
                    <th className="pb-2 pr-3 font-bold">Role</th>
                    <th className="pb-2 pr-3 font-bold">Joined</th>
                    <th className="pb-2 pr-3 font-bold">Last Active</th>
                    <th className="pb-2 pr-3 font-bold">Status</th>
                    <th className="pb-2 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ctx.members.map((m) => (
                    <tr
                      key={`${m.display_name}-${m.joined_at ?? ""}`}
                      className="border-b border-[var(--portal-sidebar-border)] last:border-b-0"
                    >
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-2.5">
                          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--portal-navy)] text-[0.6875rem] font-bold text-white">
                            {nameInitials(m.display_name)}
                          </span>
                          <div>
                            <p className="font-semibold text-[var(--portal-title)]">
                              {m.display_name}
                            </p>
                            <p className="text-[0.6875rem] text-[var(--portal-muted)]">
                              Team Member
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 text-[var(--portal-muted)]">—</td>
                      <td className="py-2.5 pr-3 text-[var(--portal-ink)]">
                        {formatJoinedDate(m.joined_at)}
                      </td>
                      <td className="py-2.5 pr-3 text-[var(--portal-muted)]">—</td>
                      <td className="py-2.5 pr-3">
                        <span className="inline-flex items-center gap-1.5 text-[0.75rem] font-semibold text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      </td>
                      <td className="py-2.5">
                        <Link
                          href="/help#messages"
                          aria-label={`Message ${m.display_name}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--portal-accent-blue)] text-[var(--portal-accent-blue)] hover:bg-[var(--portal-accent-blue-soft)]"
                        >
                          <Mail className="h-3.5 w-3.5" strokeWidth={1.75} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="m-5 mt-4 flex items-start gap-2.5 rounded-lg bg-[var(--portal-accent-blue-soft)] px-4 py-3 text-sm text-[var(--portal-title)]">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--portal-accent-blue)]" />
              <p>
                All team members can view and edit decisions. Any team member can
                submit decisions for the team.
              </p>
            </div>
          </section>

          <aside className="space-y-4">
            <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
              <h2 className="text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--portal-title)]">
                Team Information
              </h2>
              <dl className="mt-3 space-y-2 text-sm">
                {[
                  { label: "Team Name", value: ctx.team.name },
                  { label: "Team ID", value: ctx.team.join_code },
                  {
                    label: "Team Size",
                    value: `${ctx.members.length} Member${ctx.members.length === 1 ? "" : "s"}`,
                  },
                  {
                    label: "Simulation Start",
                    value: formatJoinedDate(
                      ctx.team.sessions.created_at ?? ctx.team.created_at
                    ),
                  },
                  {
                    label: "Collaboration",
                    value: "Open to all team members",
                  },
                  {
                    label: "Permissions",
                    value: "All members can edit and submit",
                  },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between gap-3">
                    <dt className="text-[var(--portal-muted)]">{row.label}</dt>
                    <dd className="text-right font-semibold text-[var(--portal-title)]">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
              <div className="flex items-start gap-2.5">
                <MessageSquare className="mt-0.5 h-4 w-4 text-[var(--portal-accent-blue)]" />
                <div>
                  <h2 className="text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--portal-title)]">
                    Team Communication
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--portal-muted)]">
                    Use messages to communicate with your team without leaving the
                    simulation.
                  </p>
                  <Link
                    href="/help#messages"
                    className="mt-3 inline-flex w-full items-center justify-center rounded-md border border-[var(--portal-accent-blue)] px-3 py-2 text-xs font-semibold text-[var(--portal-accent-blue)] hover:bg-[var(--portal-accent-blue-soft)]"
                  >
                    Open Team Messages
                  </Link>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-[var(--portal-brand)]" />
                <h2 className="text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--portal-title)]">
                  Team Tips
                </h2>
              </div>
              <ul className="mt-3 space-y-2">
                {TEAM_TIPS.map((tip) => (
                  <li key={tip} className="flex items-start gap-2 text-sm text-[var(--portal-ink)]">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" strokeWidth={2.5} />
                    {tip}
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      )}
    </TeamPageShell>
  );
}
