import { StudentPortalLayout } from "@/components/portal/StudentPortalLayout";

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StudentPortalLayout>{children}</StudentPortalLayout>;
}
