import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { writeAdminAudit } from "@/lib/admin/audit";

const RESTORE_COOKIE = "rh_admin_restore";

export async function POST() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(RESTORE_COOKIE)?.value;
  if (!raw) {
    return NextResponse.json(
      { error: "No impersonation session to exit" },
      { status: 400 }
    );
  }

  let payload: {
    access_token: string;
    refresh_token: string;
    admin_id: string;
    target_id?: string;
  };
  try {
    payload = JSON.parse(raw);
  } catch {
    cookieStore.delete(RESTORE_COOKIE);
    return NextResponse.json(
      { error: "Corrupt restore cookie" },
      { status: 400 }
    );
  }

  const response = NextResponse.json({ ok: true, home: "/admin" });

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

  const { error } = await supabase.auth.setSession({
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  response.cookies.set(RESTORE_COOKIE, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });

  await writeAdminAudit({
    actorId: payload.admin_id,
    action: "user.impersonate_exit",
    targetType: "user",
    targetId: payload.target_id ?? null,
  });

  return response;
}
