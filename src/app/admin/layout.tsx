import { AdminPortalLayout } from "@/components/portal/AdminPortalLayout";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminPortalLayout>{children}</AdminPortalLayout>;
}
