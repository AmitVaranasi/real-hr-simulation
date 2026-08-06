import { ResourcesSectionPage } from "@/components/student/ResourcesOverview";
import { PlaceholderPanel } from "@/components/student/shell/StudentShell";
import { FileSpreadsheet, FileText } from "lucide-react";

const FILES = [
  { name: "Student Simulation Guide", ext: "PDF", size: "1.2 MB", type: "pdf" },
  { name: "HR Decision Worksheet", ext: "PDF", size: "420 KB", type: "pdf" },
  { name: "Budget Planning Template", ext: "XLSX", size: "180 KB", type: "xlsx" },
  { name: "Round Checklist", ext: "PDF", size: "210 KB", type: "pdf" },
  { name: "Team Collaboration Guide", ext: "PDF", size: "350 KB", type: "pdf" },
  { name: "Grading & Submission Policy", ext: "PDF", size: "190 KB", type: "pdf" },
];

export default function DownloadsPage() {
  return (
    <ResourcesSectionPage
      title="Downloads & Course Resources"
      subtitle="Course files and worksheets. File hosting will be connected when Dr. Cooper finalizes Downloads content."
    >
      <ul className="space-y-2">
        {FILES.map((f) => {
          const Icon = f.type === "xlsx" ? FileSpreadsheet : FileText;
          return (
            <li
              key={f.name}
              className="flex items-center justify-between rounded-xl border border-[var(--portal-sidebar-border)] bg-white px-4 py-3 shadow-sm"
            >
              <span className="inline-flex items-center gap-3 text-sm font-medium text-[var(--portal-ink)]">
                <Icon className="h-4 w-4 text-[var(--portal-primary)]" />
                {f.name}
              </span>
              <span className="text-xs text-[var(--portal-muted)]">
                {f.ext} · {f.size}
              </span>
            </li>
          );
        })}
      </ul>
      <PlaceholderPanel title="Download links pending">
        Architecture and file list match the design. Actual downloadable assets
        will be attached when instructional materials are finalized.
      </PlaceholderPanel>
    </ResourcesSectionPage>
  );
}
