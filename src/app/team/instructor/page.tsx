import Link from "next/link";
import {
  Bell,
  BookOpen,
  CircleHelp,
  GraduationCap,
  Info,
  Mail,
  Megaphone,
  Quote,
  Wrench,
} from "lucide-react";
import { TeamPageShell, nameInitials } from "@/components/student/TeamChrome";
import { getStudentTeamContext } from "@/lib/student/team-context";

const REMINDERS = [
  "Review the simulation instructions.",
  "Submit your team's decisions before the deadline.",
  "Review all seven HR areas in Review & Submit.",
  "Visit the Help Center for technical issues.",
  "Contact your instructor with course questions.",
];

export default async function InstructorInfoPage() {
  const ctx = await getStudentTeamContext();
  const instructorName = ctx.instructor?.display_name ?? "Your instructor";
  const course = ctx.team?.sessions;
  const initials = nameInitials(instructorName);

  return (
    <TeamPageShell ctx={ctx} activeHref="/team/instructor">
      {!ctx.team ? (
        <p className="text-sm text-[var(--portal-muted)]">
          <Link href="/join" className="text-[var(--portal-primary)] hover:underline">
            Join a team
          </Link>{" "}
          to view instructor information.
        </p>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_var(--portal-right-rail)]">
          <div className="min-w-0 space-y-4">
            <div className="flex items-start gap-2.5 rounded-xl border border-[var(--portal-accent-blue)]/20 bg-[var(--portal-accent-blue-soft)] px-4 py-3 text-sm text-[var(--portal-title)]">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--portal-accent-blue)]" />
              <p>
                Your instructor is here to help you succeed in the simulation.
                Reach out if you have questions about the course, deadlines, or
                team expectations.
              </p>
            </div>

            <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
              <h2 className="flex items-center gap-2 text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--portal-title)]">
                <GraduationCap className="h-4 w-4 text-[var(--portal-accent-blue)]" />
                Instructor Contact
              </h2>
              <div className="mt-4 flex flex-wrap items-start gap-4">
                <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--portal-navy)] text-lg font-bold text-white">
                  {initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold text-[var(--portal-title)]">
                    {instructorName}
                  </p>
                  <p className="text-sm text-[var(--portal-muted)]">
                    Course instructor
                  </p>
                  <p className="mt-1 text-sm text-[var(--portal-ink)]">
                    {course?.name}
                    {course?.course_code ? ` · ${course.course_code}` : ""}
                  </p>
                  <Link
                    href="/help"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-[var(--portal-accent-blue)] px-3 py-1.5 text-xs font-semibold text-[var(--portal-accent-blue)] hover:bg-[var(--portal-accent-blue-soft)]"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Email Instructor
                  </Link>
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--portal-title)]">
                Communication &amp; Support
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    title: "Course Announcements",
                    href: "/dashboard",
                    label: "Go to Announcements →",
                    icon: Megaphone,
                    wrap: "bg-violet-50 text-[var(--portal-purple)]",
                  },
                  {
                    title: "Ask a Question",
                    href: "/help",
                    label: "Email Instructor →",
                    icon: CircleHelp,
                    wrap: "bg-[var(--portal-brand-soft)] text-[var(--portal-brand)]",
                  },
                  {
                    title: "Technical Support",
                    href: "/help/technical-support",
                    label: "Visit Help Center →",
                    icon: Wrench,
                    wrap: "bg-[var(--portal-accent-blue-soft)] text-[var(--portal-accent-blue)]",
                  },
                  {
                    title: "Simulation Resources",
                    href: "/resources",
                    label: "Go to Resources →",
                    icon: BookOpen,
                    wrap: "bg-emerald-50 text-emerald-700",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <article
                      key={item.title}
                      className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm"
                    >
                      <span
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${item.wrap}`}
                      >
                        <Icon className="h-4 w-4" strokeWidth={1.75} />
                      </span>
                      <h3 className="mt-2 text-sm font-bold text-[var(--portal-title)]">
                        {item.title}
                      </h3>
                      <Link
                        href={item.href}
                        className="mt-1 inline-block text-xs font-semibold text-[var(--portal-accent-blue)] hover:underline"
                      >
                        {item.label}
                      </Link>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
              <h2 className="text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--portal-title)]">
                Course Information
              </h2>
              <dl className="mt-3 space-y-2 text-sm">
                {[
                  { label: "Course", value: course?.name ?? "—" },
                  {
                    label: "Term",
                    value: course?.semester ?? "—",
                  },
                  {
                    label: "Section",
                    value: course?.course_code ?? "—",
                  },
                  { label: "Simulation", value: "Real HR Simulation" },
                  {
                    label: "Total Rounds",
                    value: course?.rounds_total != null ? String(course.rounds_total) : "—",
                  },
                  { label: "Grading", value: "Set by your instructor" },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between gap-3">
                    <dt className="text-[var(--portal-muted)]">{row.label}</dt>
                    <dd className="text-right font-semibold text-[var(--portal-title)]">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
              <Link
                href="/resources/reference"
                className="mt-3 inline-flex w-full items-center justify-center rounded-md border border-[var(--portal-accent-blue)] px-3 py-2 text-xs font-semibold text-[var(--portal-accent-blue)] hover:bg-[var(--portal-accent-blue-soft)]"
              >
                View Course Syllabus
              </Link>
            </section>

            <section className="rounded-xl border border-[var(--portal-brand)]/30 bg-[var(--portal-brand-soft)] p-4">
              <h2 className="flex items-center gap-2 text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--portal-title)]">
                <Bell className="h-4 w-4 text-[var(--portal-brand)]" />
                Important Reminders
              </h2>
              <ul className="mt-3 space-y-2">
                {REMINDERS.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm text-[var(--portal-title)]"
                  >
                    <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white text-[var(--portal-brand)]">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
              <h2 className="flex items-center gap-2 text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--portal-title)]">
                <Quote className="h-4 w-4 text-emerald-700" />
                Instructor Message
              </h2>
              {course?.announcement ? (
                <p className="mt-3 whitespace-pre-wrap text-sm italic leading-relaxed text-[var(--portal-ink)]">
                  {course.announcement}
                </p>
              ) : (
                <p className="mt-3 text-sm italic text-[var(--portal-muted)]">
                  No instructor message posted yet.
                </p>
              )}
            </section>
          </aside>
        </div>
      )}
    </TeamPageShell>
  );
}
