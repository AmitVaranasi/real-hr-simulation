import { StudentPortalLayout } from "@/components/portal/StudentPortalLayout";

export default function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StudentPortalLayout>{children}</StudentPortalLayout>;
}
