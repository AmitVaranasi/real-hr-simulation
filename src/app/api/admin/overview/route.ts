import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Server is missing service role configuration" },
      { status: 500 }
    );
  }

  const [users, sessions, teams, instructors] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("sessions").select("id", { count: "exact", head: true }),
    admin.from("teams").select("id", { count: "exact", head: true }),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "instructor"),
  ]);

  return NextResponse.json({
    counts: {
      users: users.count ?? 0,
      sessions: sessions.count ?? 0,
      teams: teams.count ?? 0,
      instructors: instructors.count ?? 0,
    },
  });
}
