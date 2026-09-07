import { SessionAnnouncementsPage } from "@/components/instructor/SessionCoursePages";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const view = (await searchParams).view;
  return SessionAnnouncementsPage({
    params,
    view:
      view === "scheduled" || view === "drafts" || view === "archived"
        ? view
        : "all",
  });
}
