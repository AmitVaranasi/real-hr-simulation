import { StudentPortalLayout } from "@/components/portal/StudentPortalLayout";

export default function LeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StudentPortalLayout>{children}</StudentPortalLayout>;
}
