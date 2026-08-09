"use client";

import Link from "next/link";
import {
  BookOpen,
  Check,
  Download,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Headphones,
  Lightbulb,
} from "lucide-react";
import {
  COURSE_DOWNLOADS,
  SIM_DOWNLOADS,
  ResourcesBreadcrumb,
  ResourcesContextCards,
  ResourcesFooter,
  ResourcesInfoBanner,
  ResourcesSearchRow,
  ResourcesSideCard,
  type ResourcesContext,
} from "@/components/student/resources/ResourcesShared";

function typeIcon(type: string) {
  if (type === "XLSX") return FileSpreadsheet;
  return FileText;
}

function DownloadTable({
  title,
  rows,
}: {
  title: string;
  rows: ReadonlyArray<{
    name: string;
    description: string;
    type: string;
    size: string;
    updated: string;
  }>;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-[var(--portal-sidebar-border)] bg-white shadow-sm">
      <div className="border-b border-[var(--portal-sidebar-border)] bg-[#f8fafc] px-4 py-3">
        <h2 className="text-sm font-bold text-[var(--portal-title)]">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--portal-sidebar-border)] text-[10px] font-bold uppercase tracking-wide text-[var(--portal-muted)]">
              <th className="px-4 py-2.5 font-bold">Resource</th>
              <th className="px-4 py-2.5 font-bold">Description</th>
              <th className="px-4 py-2.5 font-bold">Type</th>
              <th className="px-4 py-2.5 font-bold">Size</th>
              <th className="px-4 py-2.5 font-bold">Last Updated</th>
              <th className="px-4 py-2.5 font-bold" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const Icon = typeIcon(row.type);
              return (
                <tr
                  key={row.name}
                  className={
                    i % 2 === 0
                      ? "bg-white"
                      : "bg-[#f8fafc]"
                  }
                >
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2 font-semibold text-[var(--portal-title)]">
                      <Icon className="h-4 w-4 text-[var(--portal-primary)]" />
                      {row.name}
                    </span>
                  </td>
                  <td className="max-w-[280px] px-4 py-3 text-xs leading-relaxed text-[var(--portal-muted)]">
                    {row.description}
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-[var(--portal-ink)]">
                    {row.type}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--portal-muted)]">
                    {row.size}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--portal-muted)]">
                    {row.updated}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--portal-sidebar-border)] text-[var(--portal-primary)] hover:bg-[var(--portal-primary-soft)]"
                      aria-label={`Download ${row.name}`}
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function DownloadsView({ context }: { context: ResourcesContext }) {
  return (
    <div className="pb-8">
      <ResourcesBreadcrumb current="Downloads & Course Resources" />

      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-[28px] font-bold text-[var(--portal-title)]">
            Downloads &amp; Course Resources
          </h1>
          <p className="mt-1 text-sm text-[var(--portal-muted)]">
            Access important documents, templates, and resources provided by your
            instructor and the simulation team.
          </p>
        </div>
        <ResourcesContextCards context={context} />
      </div>

      <div className="mt-4">
        <ResourcesSearchRow placeholder="Search resources..." />
      </div>

      <div className="mt-4">
        <ResourcesInfoBanner>
          Use these resources throughout the simulation to support planning,
          decision-making, and team collaboration.
        </ResourcesInfoBanner>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          <DownloadTable
            title="Simulation Resources (Provided by Simulation Team)"
            rows={SIM_DOWNLOADS}
          />
          <DownloadTable
            title="Course Resources (Provided by Your Instructor)"
            rows={COURSE_DOWNLOADS}
          />

          <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-[var(--portal-ink)]">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="leading-relaxed">
              Resources may be updated throughout the simulation. Check back
              regularly for new materials from your instructor.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <ResourcesSideCard title="How to Use These Resources" icon={BookOpen}>
            <ul className="space-y-2.5">
              {[
                "Read the Student Guide before making your first decisions.",
                "Use worksheets and templates to structure team discussions.",
                "Download course materials for assignments and reflections.",
                "Revisit resources as needed throughout each round.",
              ].map((item) => (
                <li key={item} className="flex gap-2 text-[var(--portal-ink)]">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </ResourcesSideCard>

          <ResourcesSideCard title="Resource Categories" icon={FolderOpen}>
            <ul className="space-y-3">
              <li className="flex gap-2.5">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-[var(--portal-purple)]">
                  <FileText className="h-4 w-4" />
                </span>
                <span>
                  <strong className="block text-[var(--portal-title)]">
                    Simulation Resources
                  </strong>
                  Guides and templates from the simulation team.
                </span>
              </li>
              <li className="flex gap-2.5">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <FolderOpen className="h-4 w-4" />
                </span>
                <span>
                  <strong className="block text-[var(--portal-title)]">
                    Course Resources
                  </strong>
                  Materials uploaded by your instructor.
                </span>
              </li>
            </ul>
          </ResourcesSideCard>

          <ResourcesSideCard
            title="Need More Help?"
            icon={Headphones}
            footer={
              <Link
                href="/help"
                className="inline-flex w-full items-center justify-center rounded-lg border border-[var(--portal-primary)] bg-white px-3 py-2 text-sm font-semibold text-[var(--portal-primary)] hover:bg-[var(--portal-primary-soft)]"
              >
                Go to Help Center →
              </Link>
            }
          >
            <p>
              If a file is missing or you need clarification, contact your
              instructor or visit the Help Center.
            </p>
          </ResourcesSideCard>
        </div>
      </div>

      <ResourcesFooter />
    </div>
  );
}
