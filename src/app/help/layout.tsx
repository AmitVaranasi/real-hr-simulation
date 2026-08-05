import { StudentPortalLayout } from "@/components/portal/StudentPortalLayout";

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StudentPortalLayout>{children}</StudentPortalLayout>;
}
