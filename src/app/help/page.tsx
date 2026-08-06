import Link from "next/link";
import {
  PlaceholderPanel,
  StudentChromeCard,
  StudentPageHeader,
} from "@/components/student/shell/StudentShell";
import {
  BookOpen,
  CircleHelp,
  MessageSquare,
  Wrench,
} from "lucide-react";

export default function HelpCenterPage() {
  return (
    <div>
      <StudentPageHeader
        title="Help Center"
        subtitle="Guides for navigating the simulation, troubleshooting, and getting instructional support."
        badge="Student Support"
      />

      <div className="mb-5 rounded-xl border border-[var(--portal-accent-blue)]/30 bg-[var(--portal-accent-blue-soft)] px-4 py-3 text-sm text-[var(--portal-title)]">
        Start with Resources for learning content. Use this Help Center for
        navigation, troubleshooting, and instructor contact paths.
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StudentChromeCard title="Simulation navigation" accent>
          <div className="flex gap-3 text-sm text-[var(--portal-ink)]">
            <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-[var(--portal-primary)]" />
            <p>
              Use Getting Started to prepare, Dashboard for operational status, HR
              Decisions for round inputs, Review &amp; Submit before locking, and
              Reports &amp; HR Analytics after rounds close.
            </p>
          </div>
        </StudentChromeCard>

        <StudentChromeCard title="Technical troubleshooting">
          <div className="flex gap-3 text-sm text-[var(--portal-ink)]">
            <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-[var(--portal-accent-blue)]" />
            <p>
              If pages fail to load, refresh and confirm you are signed in. Contact
              your instructor if you cannot join a team or access an open round.
            </p>
          </div>
        </StudentChromeCard>

        <PlaceholderPanel title="FAQs">
          <div className="flex gap-3">
            <CircleHelp className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Expanded FAQ content will be added as the Help Center architecture is
              finalized. For now, start with{" "}
              <Link
                href="/resources/reference"
                className="font-semibold text-[var(--portal-accent-blue)] hover:underline"
              >
                Resources → Simulation Reference Center
              </Link>
              .
            </p>
          </div>
        </PlaceholderPanel>

        <StudentChromeCard title="Messages">
          <div className="flex gap-3 text-sm text-[var(--portal-ink)]" id="messages">
            <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-[var(--portal-primary)]" />
            <p>
              Team messaging is planned for a later iteration. Use instructor
              announcements on{" "}
              <Link
                href="/team/instructor"
                className="font-semibold text-[var(--portal-accent-blue)] hover:underline"
              >
                Team &amp; Company → Instructor Information
              </Link>
              .
            </p>
          </div>
        </StudentChromeCard>
      </div>
    </div>
  );
}
