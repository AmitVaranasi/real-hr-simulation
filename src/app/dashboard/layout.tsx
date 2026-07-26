import { StudentPortalLayout } from "@/components/portal/StudentPortalLayout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StudentPortalLayout>{children}</StudentPortalLayout>;
}
