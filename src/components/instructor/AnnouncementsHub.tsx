"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  FileText,
  Lightbulb,
  Mail,
  Megaphone,
  MoreVertical,
  Users,
} from "lucide-react";
import { SessionAnnouncementForm } from "@/components/instructor/SessionAnnouncementForm";
import {
  ProfessorFilterBar,
  ProfessorHelpBanner,
  ProfessorPageGrid,
  ProfessorStandardRail,
  ProfessorTabBar,
  type CourseRailState,
} from "@/components/instructor/ProfessorChrome";
import { ProfessorPageHeader } from "@/components/instructor/ProfessorShell";
import { formInputClassName, formSelectClassName } from "@/components/ui/form-controls";

type AnnouncementView = "all" | "scheduled" | "drafts" | "archived";

const VIEW_COPY: Record<
  AnnouncementView,
  { title: string; subtitle: string; empty: string }
> = {
  all: {
    title: "Announcements",
    subtitle:
      "Create and manage announcements for your class. Messages appear on the student dashboard.",
    empty: "No announcement posted.",
  },
  scheduled: {
    title: "Scheduled Announcements",
    subtitle:
      "View and manage announcements that are scheduled to be delivered to your students.",
    empty:
      "No scheduled announcements. Scheduling is not stored yet — this course has one posted announcement object.",
  },
  drafts: {
    title: "Draft Announcements",
    subtitle: "Drafts are not a second store. Autosave never publishes.",
    empty:
      "No drafts. Drafts are not stored separately from the posted announcement.",
  },
  archived: {
    title: "Archived Announcements",
    subtitle:
      "Archived records would be immutable. This course has one posted announcement object.",
    empty:
      "No archived announcements. Archive is not a separate store yet.",
  },
};

const TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "general", label: "General" },
  { value: "round", label: "Round Update" },
  { value: "reminder", label: "Reminder" },
  { value: "resource", label: "Resource" },
];

function toDateInputValue(iso?: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}


/* Per-type icon + colour, transcribed from professor_announcements_editable. */
const TYPE_STYLE: Record<
  string,
  { icon: typeof Megaphone; wrap: string; pill: string }
> = {
  General: {
    icon: Megaphone,
    wrap: "bg-[var(--portal-accent-blue-soft)] text-[var(--portal-accent-blue)]",
    pill: "bg-[var(--portal-accent-blue-soft)] text-[var(--portal-accent-blue)]",
  },
  "Round Update": {
    icon: CalendarDays,
    wrap: "bg-[#fdece2] text-[var(--portal-brand)]",
    pill: "bg-[#fdece2] text-[var(--portal-brand)]",
  },
  Reminder: {
    icon: FileText,
    wrap: "bg-violet-50 text-violet-600",
    pill: "bg-violet-50 text-violet-700",
  },
  Resource: {
    icon: Lightbulb,
    wrap: "bg-emerald-50 text-emerald-600",
    pill: "bg-emerald-50 text-emerald-700",
  },
};

export function AnnouncementsHub({
  sessionId,
  announcement,
  updatedAt,
  rail,
  initialView = "all",
  roundOptions = [],
}: {
  sessionId: string;
  announcement: string | null;
  updatedAt?: string | null;
  rail: CourseRailState;
  initialView?: AnnouncementView;
  roundOptions?: string[];
}) {
  const [tab, setTab] = useState<AnnouncementView>(initialView);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [roundFilter, setRoundFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showForm, setShowForm] = useState(!announcement);

  useEffect(() => {
    setTab(initialView);
  }, [initialView]);

  const posted = announcement?.trim()
    ? {
        title: announcement.trim(),
        type: "General",
        typeKey: "general",
        audience: "All Students",
        posted: updatedAt
          ? new Date(updatedAt).toLocaleString()
          : "Posted",
        postedDate: toDateInputValue(updatedAt),
        status: "Posted" as const,
      }
    : null;

  const visible = useMemo(() => {
    if (tab !== "all") return [];
    if (!posted) return [];
    if (query && !posted.title.toLowerCase().includes(query.toLowerCase())) {
      return [];
    }
    if (typeFilter !== "all" && posted.typeKey !== typeFilter) return [];
    if (roundFilter !== "all") return [];
    if (dateFilter && posted.postedDate && posted.postedDate !== dateFilter) {
      return [];
    }
    if (dateFilter && !posted.postedDate) return [];
    return [posted];
  }, [dateFilter, posted, query, roundFilter, tab, typeFilter]);

  const showMetrics = tab === "archived";
  const colCount = showMetrics ? 7 : 6;

  return (
    <ProfessorPageGrid
      rail={
        <ProfessorStandardRail
          toolsTitle="Announcement Tools"
          course={rail}
          tools={[
            {
              title: "New Announcement",
              icon: <Megaphone className="h-4 w-4" strokeWidth={1.75} />,
              body: "Post a message students see under Instructor Information.",
              action: "Create New",
              onClick: () => {
                setTab("all");
                setShowForm(true);
              },
            },
            {
              title: "Announcement Templates",
              icon: <FileText className="h-4 w-4" strokeWidth={1.75} />,
              body: "Templates are not a second message store. Use the posted announcement.",
              action: "View Templates",
              href: "/sessions/professor-resources/guide",
            },
            {
              title: "Email Settings",
              icon: <Mail className="h-4 w-4" strokeWidth={1.75} />,
              body: "Announcements appear in the student portal. There is no separate email engine.",
              action: "Manage Settings",
              href: `/sessions/${sessionId}/course`,
            },
          ]}
        />
      }
    >
      <ProfessorPageHeader
        title={VIEW_COPY[tab].title}
        subtitle={VIEW_COPY[tab].subtitle}
        breadcrumbs={[
          { label: "Dashboard", href: "/sessions" },
          { label: "Course Management", href: `/sessions/${sessionId}/course` },
          { label: "Announcements" },
        ]}
        actions={
          <button
            type="button"
            onClick={() => {
              setTab("all");
              setShowForm(true);
            }}
            className="rounded-md bg-[var(--portal-accent-blue)] px-3.5 py-2 text-sm font-semibold text-white"
          >
            + New Announcement
          </button>
        }
      />

      <ProfessorTabBar
        active={tab}
        onChange={(id) => setTab(id as AnnouncementView)}
        tabs={[
          {
            id: "all",
            label: "All Announcements",
            href: `/sessions/${sessionId}/announcements`,
          },
          {
            id: "scheduled",
            label: "Scheduled",
            href: `/sessions/${sessionId}/announcements?view=scheduled`,
          },
          {
            id: "drafts",
            label: "Drafts",
            href: `/sessions/${sessionId}/announcements?view=drafts`,
          },
          {
            id: "archived",
            label: "Archived",
            href: `/sessions/${sessionId}/announcements?view=archived`,
          },
        ]}
      />

      <ProfessorFilterBar
        search={query}
        onSearch={setQuery}
        searchPlaceholder="Search announcements..."
      >
        <select
          className={`${formSelectClassName} min-w-0`}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          {TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          className={`${formSelectClassName} min-w-0`}
          value={roundFilter}
          onChange={(e) => setRoundFilter(e.target.value)}
        >
          <option value="all">All Rounds</option>
          {roundOptions.map((label) => (
            <option key={label} value={label}>
              {label}
            </option>
          ))}
        </select>
        <label className="relative min-w-0">
          <CalendarDays
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--portal-muted)]"
            strokeWidth={1.75}
          />
          <input
            type="date"
            className={`${formInputClassName} pl-9`}
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            aria-label="Filter by date"
          />
        </label>
      </ProfessorFilterBar>

      {showForm ? (
        <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-[var(--portal-title)]">
            {announcement ? "Update posted announcement" : "New announcement"}
          </h2>
          <p className="mt-1 text-sm text-[var(--portal-muted)]">
            One announcement object. Posted text is what students see.
          </p>
          <SessionAnnouncementForm
            sessionId={sessionId}
            initialAnnouncement={announcement}
            onPosted={() => setShowForm(false)}
            onCancel={() => setShowForm(false)}
          />
        </section>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-[var(--portal-sidebar-border)] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f8f9fb] text-[0.8125rem] font-semibold text-[var(--portal-muted)]">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">Announcement</th>
                <th className="px-4 py-3 whitespace-nowrap">Type</th>
                <th className="px-4 py-3 whitespace-nowrap">Audience</th>
                <th className="px-4 py-3 whitespace-nowrap">Posted / Scheduled</th>
                {showMetrics ? (
                  <>
                    <th className="px-4 py-3 whitespace-nowrap">Reach</th>
                    <th className="px-4 py-3 whitespace-nowrap">Engagement</th>
                  </>
                ) : (
                  <th className="px-4 py-3 whitespace-nowrap">Status</th>
                )}
                <th className="px-4 py-3 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td
                    colSpan={colCount}
                    className="px-4 py-8 text-center text-[var(--portal-muted)]"
                  >
                    {VIEW_COPY[tab].empty}
                  </td>
                </tr>
              ) : (
                visible.map((row) => (
                  <tr
                    key={row.title}
                    className="border-t border-[var(--portal-sidebar-border)]"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        <span
                          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                            TYPE_STYLE[row.type]?.wrap ??
                            "bg-[var(--portal-accent-blue-soft)] text-[var(--portal-accent-blue)]"
                          }`}
                        >
                          {(() => {
                            const Icon =
                              TYPE_STYLE[row.type]?.icon ?? Megaphone;
                            return <Icon className="h-4 w-4" strokeWidth={2} />;
                          })()}
                        </span>
                        <p className="font-medium text-[var(--portal-title)]">
                          {row.title}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold ${
                          TYPE_STYLE[row.type]?.pill ??
                          "bg-[var(--portal-accent-blue-soft)] text-[var(--portal-accent-blue)]"
                        }`}
                      >
                        {row.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <Users
                          className="h-4 w-4 shrink-0 text-[var(--portal-accent-blue)]"
                          strokeWidth={1.75}
                        />
                        {row.audience}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--portal-muted)]">
                      {row.posted}
                    </td>
                    {showMetrics ? (
                      <>
                        <td className="px-4 py-3 text-[var(--portal-muted)]">—</td>
                        <td className="px-4 py-3 text-[var(--portal-muted)]">—</td>
                      </>
                    ) : (
                      <td className="px-4 py-3">
                        <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[0.6875rem] font-semibold text-emerald-800">
                          {row.status}
                        </span>
                      </td>
                    )}
                    <td className="relative px-4 py-3 text-right">
                      <button
                        type="button"
                        aria-label="Announcement actions"
                        onClick={() => setMenuOpen((open) => !open)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--portal-muted)] hover:bg-[#f4f5f7] hover:text-[var(--portal-ink)]"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {menuOpen ? (
                        <div className="absolute right-4 top-11 z-10 w-40 rounded-md border border-[var(--portal-sidebar-border)] bg-white py-1 text-left shadow-md">
                          <button
                            type="button"
                            onClick={() => {
                              setShowForm(true);
                              setMenuOpen(false);
                            }}
                            className="block w-full px-3 py-1.5 text-left text-xs font-semibold text-[var(--portal-ink)] hover:bg-[#f4f5f7]"
                          >
                            Edit
                          </button>
                          <p className="px-3 py-1.5 text-[0.6875rem] text-[var(--portal-muted)]">
                            Schedule and archive need a lifecycle store.
                          </p>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--portal-sidebar-border)] px-4 py-3 text-[0.8125rem] text-[var(--portal-muted)]">
          <span>
            {visible.length === 0
              ? "No announcements"
              : `Showing 1 to ${visible.length} of ${visible.length} announcement${
                  visible.length === 1 ? "" : "s"
                }`}
          </span>
          <div className="flex items-center gap-1">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--portal-sidebar-border)] text-[var(--portal-muted)]">
              ‹
            </span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[var(--portal-accent-blue)] font-semibold text-white">
              1
            </span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--portal-sidebar-border)] text-[var(--portal-muted)]">
              ›
            </span>
          </div>
          <span className="rounded-md border border-[var(--portal-sidebar-border)] px-3 py-1.5">
            10 per page
          </span>
        </div>
      </section>

      <ProfessorHelpBanner
        title="Need help with announcements?"
        body="Visit the Professor Guide for how posted messages appear to students."
      />
    </ProfessorPageGrid>
  );
}
