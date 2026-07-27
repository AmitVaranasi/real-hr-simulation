import { createClient } from "@/lib/supabase/server";
import { AdminPortalLayout } from "@/components/portal/AdminPortalLayout";
import { ProfessorPortalLayout } from "@/components/portal/ProfessorPortalLayout";

export default async function SessionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    role = profile?.role ?? null;

    const allowlist = (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (
      role !== "admin" &&
      user.email &&
      allowlist.includes(user.email.toLowerCase())
    ) {
      role = "admin";
    }
  }

  if (role === "admin") {
    return <AdminPortalLayout>{children}</AdminPortalLayout>;
  }

  return <ProfessorPortalLayout>{children}</ProfessorPortalLayout>;
}
