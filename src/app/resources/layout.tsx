import { StudentPortalLayout } from "@/components/portal/StudentPortalLayout";

export default function ResourcesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StudentPortalLayout>{children}</StudentPortalLayout>;
}
