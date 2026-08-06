import { StudentPortalLayout } from "@/components/portal/StudentPortalLayout";

export default function ReviewEntryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StudentPortalLayout>{children}</StudentPortalLayout>;
}
