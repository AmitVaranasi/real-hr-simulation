import { TestingCenterHub } from "@/components/instructor/TestingCenterHub";
import {
  courseRail,
  loadActiveCourse,
} from "@/lib/instructor/load-course-context";

export const dynamic = "force-dynamic";

export default async function TestingCenterPage() {
  const course = await loadActiveCourse();
  return <TestingCenterHub rail={courseRail(course)} />;
}
