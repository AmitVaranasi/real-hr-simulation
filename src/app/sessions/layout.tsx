import { ProfessorPortalLayout } from "@/components/portal/ProfessorPortalLayout";

export default function SessionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProfessorPortalLayout>{children}</ProfessorPortalLayout>;
}
