import { StudentPortalLayout } from "@/components/portal/StudentPortalLayout";

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StudentPortalLayout>{children}</StudentPortalLayout>;
}
