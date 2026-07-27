import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAdminAudit } from "@/lib/admin/audit";

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  let body: { email?: string; userId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let email = body.email?.trim().toLowerCase();
  const userId = body.userId?.trim();

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Server is missing service role configuration" },
      { status: 500 }
    );
  }

  if (!email && userId) {
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error || !data.user?.email) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    email = data.user.email.toLowerCase();
  }

  if (!email) {
    return NextResponse.json(
      { error: "email or userId is required" },
      { status: 400 }
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

  await writeAdminAudit({
    actorId: auth.user!.id,
    action: "user.reset_password",
    targetType: "user",
    targetId: userId ?? email,
    meta: { email },
  });

  return NextResponse.json({ ok: true, message: "Reset email sent" });
}
