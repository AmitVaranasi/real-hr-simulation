import {
  PlaceholderPanel,
  StudentPageHeader,
} from "@/components/student/shell/StudentShell";

export default function HelpCenterPage() {
  return (
    <div>
      <StudentPageHeader
        title="Help Center"
        subtitle="Guides for navigating the simulation, troubleshooting, and getting instructional support."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <PlaceholderPanel title="Simulation navigation">
          Use Getting Started to prepare, Dashboard for operational status, HR
          Decisions for round inputs, Review & Submit before locking, and Reports &
          HR Analytics after rounds close.
        </PlaceholderPanel>
        <PlaceholderPanel title="Technical troubleshooting">
          If pages fail to load, refresh and confirm you are signed in. Contact your
          instructor if you cannot join a team or access an open round.
        </PlaceholderPanel>
        <PlaceholderPanel title="FAQs">
          Expanded FAQ content will be added as the Help Center architecture is
          finalized. For now, start with Resources → Simulation Reference Center.
        </PlaceholderPanel>
        <PlaceholderPanel title="Messages">
          <span id="messages">
            Team messaging is planned for a later iteration. Use instructor
            announcements on Team & Company → Instructor Information.
          </span>
        </PlaceholderPanel>
      </div>
    </div>
  );
}
