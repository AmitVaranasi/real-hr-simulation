import Link from "next/link";
import {
  PlaceholderPanel,
  StudentPageHeader,
} from "@/components/student/shell/StudentShell";

export default function ResourcesHomePage() {
  return (
    <div>
      <StudentPageHeader
        title="Resources"
        subtitle="Reference materials that support learning before, during, and after HR decisions."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/resources/reference"
          className="rounded-xl border border-[#dde1e6] bg-white p-5 shadow-sm transition hover:border-[#e67e22]"
        >
          <h2 className="font-semibold text-[#0f172a]">
            Simulation Reference Center
          </h2>
          <p className="mt-2 text-sm text-[#6b7280]">
            How the simulation works, rounds, budgets, and report navigation.
          </p>
        </Link>
        <Link
          href="/resources/metrics"
          className="rounded-xl border border-[#dde1e6] bg-white p-5 shadow-sm transition hover:border-[#e67e22]"
        >
          <h2 className="font-semibold text-[#0f172a]">HR Metrics Reference</h2>
          <p className="mt-2 text-sm text-[#6b7280]">
            Definitions for workforce and organizational metrics used in The
            Workforce Brief.
          </p>
        </Link>
      </div>
      <div className="mt-6">
        <PlaceholderPanel title="Content in progress">
          Deeper Learning Guide and reference articles will be added as Dr. Cooper
          finalizes instructional content. Architecture and navigation are active now.
        </PlaceholderPanel>
      </div>
    </div>
  );
}
