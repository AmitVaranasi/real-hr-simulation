import { StudentPortalLayout } from "@/components/portal/StudentPortalLayout";

export default function DecisionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StudentPortalLayout>{children}</StudentPortalLayout>;
}
