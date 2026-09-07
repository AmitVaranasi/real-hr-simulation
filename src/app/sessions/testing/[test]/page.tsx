import { TestScreen, type TestId } from "@/components/instructor/TestScreen";
import { TestingCenterHub } from "@/components/instructor/TestingCenterHub";
import {
  courseRail,
  loadActiveCourse,
} from "@/lib/instructor/load-course-context";

export const dynamic = "force-dynamic";

const TEST_IDS: TestId[] = [
  "scenario",
  "multiplier",
  "sensitivity",
  "stress",
  "carry-forward",
  "custom",
];

export default async function TestingTypePage({
  params,
}: {
  params: Promise<{ test: string }>;
}) {
  const { test } = await params;
  const course = await loadActiveCourse();
  const rail = courseRail(course);
  return TEST_IDS.includes(test as TestId) ? (
    <TestScreen rail={rail} test={test as TestId} />
  ) : (
    <TestingCenterHub rail={rail} selected={test} />
  );
}
