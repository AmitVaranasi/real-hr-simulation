import { MetricsReferenceView } from "@/components/instructor/ReferenceViews";
import {
  courseRail,
  loadActiveCourse,
} from "@/lib/instructor/load-course-context";

export const dynamic = "force-dynamic";

export default async function ReferencePage() {
  const course = await loadActiveCourse();
  return <MetricsReferenceView rail={courseRail(course)} />;
}
