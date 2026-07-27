import { StudentPortalLayout } from "@/components/portal/StudentPortalLayout";

export default function JoinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StudentPortalLayout>{children}</StudentPortalLayout>;
}
