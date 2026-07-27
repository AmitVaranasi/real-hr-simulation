import { StudentPortalLayout } from "@/components/portal/StudentPortalLayout";

export default function RoundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StudentPortalLayout>{children}</StudentPortalLayout>;
}
