import { ManageCourseHub } from "@/components/instructor/ManageCourseHub";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ManageCoursePage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const { session: sessionParam } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/sessions/manage");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "instructor") redirect("/dashboard");

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, name, status, teams(id)")
    .eq("instructor_id", user.id)
    .order("created_at", { ascending: false });

  const options = (sessions ?? []).map((s) => ({
    id: s.id as string,
    name: s.name as string,
    status: s.status as string,
    teamCount: ((s.teams as Array<{ id: string }> | null) ?? []).length,
  }));

  const active =
    options.find((s) => s.id === sessionParam) ??
    options.find((s) => s.status === "active") ??
    options[0] ??
    null;

  return (
    <ManageCourseHub
      sessions={options}
      activeSessionId={active?.id ?? null}
    />
  );
}
