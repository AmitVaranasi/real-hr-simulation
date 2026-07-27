import { NextResponse } from "next/server";
import { requireInstructor } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Instructor-assisted password reset: sends a Supabase recovery email
 * to a student who belongs to one of the instructor's sessions.
 */
export async function POST(request: Request) {
  const auth = await requireInstructor();
  if (auth.error) return auth.error;

  let body: { email?: string; sessionId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const sessionId = body.sessionId;
  if (!email || !sessionId) {
    return NextResponse.json(
      { error: "email and sessionId are required" },
      { status: 400 }
    );
  }

  const { data: session } = await auth.supabase
    .from("sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("instructor_id", auth.user!.id)
    .maybeSingle();

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Server is missing service role configuration" },
      { status: 500 }
    );
  }

  const { data: list, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 });
  }

  const target = list.users.find(
    (u) => u.email?.toLowerCase() === email
  );
  if (!target) {
    return NextResponse.json(
      { error: "No user found with that email" },
      { status: 404 }
    );
  }

  const { data: membership } = await auth.supabase
    .from("team_members")
    .select("id, teams!inner(session_id)")
    .eq("user_id", target.id)
    .eq("teams.session_id", sessionId)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json(
      { error: "That user is not a member of a team in this session" },
      { status: 403 }
    );
  }

  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    new URL(request.url).origin;

  const { error: resetError } = await admin.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/auth/reset-password`,
  });

  if (resetError) {
    return NextResponse.json({ error: resetError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "Reset email sent" });
}
