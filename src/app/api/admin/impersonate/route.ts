import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAdminAudit } from "@/lib/admin/audit";

const RESTORE_COOKIE = "rh_admin_restore";

export async function GET() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(RESTORE_COOKIE)?.value;
  if (!raw) {
    return NextResponse.json({ impersonating: false });
  }
  try {
    const payload = JSON.parse(raw) as {
      admin_id?: string;
      target_id?: string;
    };
    return NextResponse.json({
      impersonating: true,
      admin_id: payload.admin_id ?? null,
      target_id: payload.target_id ?? null,
    });
  } catch {
    return NextResponse.json({ impersonating: false });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  let body: { userId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const userId = body.userId?.trim();
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }
  if (userId === auth.user!.id) {
    return NextResponse.json(
      { error: "Cannot impersonate yourself" },
      { status: 400 }
    );
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

  const { data: targetUser, error: getErr } =
    await admin.auth.admin.getUserById(userId);
  if (getErr || !targetUser.user?.email) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("role, disabled_at")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.disabled_at) {
    return NextResponse.json(
      { error: "Cannot impersonate a disabled user" },
      { status: 400 }
    );
  }

  const {
    data: { session: adminSession },
  } = await auth.supabase.auth.getSession();

  if (!adminSession?.access_token || !adminSession.refresh_token) {
    return NextResponse.json(
      { error: "Missing admin session to restore later" },
      { status: 400 }
    );
  }

  const { data: linkData, error: linkError } =
    await admin.auth.admin.generateLink({
      type: "magiclink",
      email: targetUser.user.email,
    });

  if (linkError || !linkData?.properties?.hashed_token) {
    return NextResponse.json(
      { error: linkError?.message ?? "Could not generate impersonation link" },
      { status: 500 }
    );
  }

  const cookieStore = await cookies();
  const restorePayload = JSON.stringify({
    access_token: adminSession.access_token,
    refresh_token: adminSession.refresh_token,
    admin_id: auth.user!.id,
    target_id: userId,
  });

  cookieStore.set(RESTORE_COOKIE, restorePayload, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 4,
  });

  // Establish target session in response cookies
  const response = NextResponse.json({
    ok: true,
    target: {
      id: userId,
      email: targetUser.user.email,
      role: profile?.role ?? null,
    },
    home:
      profile?.role === "instructor"
        ? "/sessions"
        : profile?.role === "admin"
          ? "/admin"
          : "/dashboard",
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error: otpError } = await supabase.auth.verifyOtp({
    type: "email",
    token_hash: linkData.properties.hashed_token,
  });

  if (otpError) {
    response.cookies.delete(RESTORE_COOKIE);
    return NextResponse.json(
      { error: otpError.message },
      { status: 500 }
    );
  }

  await writeAdminAudit({
    actorId: auth.user!.id,
    action: "user.impersonate",
    targetType: "user",
    targetId: userId,
    meta: { email: targetUser.user.email },
  });

  // Re-apply restore cookie on the response (verifyOtp may rewrite cookies)
  response.cookies.set(RESTORE_COOKIE, restorePayload, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 4,
  });

  return response;
}
