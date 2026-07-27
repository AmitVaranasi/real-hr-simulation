import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAdminAudit } from "@/lib/admin/audit";

const ROLES = new Set(["student", "instructor", "admin"]);

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

  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, display_name, role, created_at, disabled_at, disabled_reason")
    .order("created_at", { ascending: false });

  if (error) {
    // Fallback if migration-v6 columns missing
    const fallback = await admin
      .from("profiles")
      .select("id, display_name, role, created_at")
      .order("created_at", { ascending: false });
    if (fallback.error) {
      return NextResponse.json({ error: fallback.error.message }, { status: 500 });
    }

    const { data: list, error: listError } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (listError) {
      return NextResponse.json({ error: listError.message }, { status: 500 });
    }
    const byId = new Map(list.users.map((u) => [u.id, u]));
    return NextResponse.json({
      users: (fallback.data ?? []).map((p) => {
        const u = byId.get(p.id);
        const bannedUntil = (u as { banned_until?: string } | undefined)
          ?.banned_until;
        return {
          id: p.id,
          display_name: p.display_name,
          role: p.role,
          created_at: p.created_at,
          email: u?.email?.toLowerCase() ?? null,
          disabled: !!bannedUntil && new Date(bannedUntil) > new Date(),
          disabled_at: null,
          disabled_reason: null,
          banned_until: bannedUntil ?? null,
        };
      }),
    });
  }

  const { data: list, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 });
  }

  const byId = new Map(list.users.map((u) => [u.id, u]));

  const users = (profiles ?? []).map((p) => {
    const u = byId.get(p.id);
    const bannedUntil = (u as { banned_until?: string } | undefined)
      ?.banned_until;
    const authBanned =
      !!bannedUntil && new Date(bannedUntil) > new Date();
    return {
      id: p.id,
      display_name: p.display_name,
      role: p.role,
      created_at: p.created_at,
      email: u?.email?.toLowerCase() ?? null,
      disabled: !!p.disabled_at || authBanned,
      disabled_at: p.disabled_at ?? null,
      disabled_reason: p.disabled_reason ?? null,
      banned_until: bannedUntil ?? null,
    };
  });

  return NextResponse.json({ users });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  let body: {
    userId?: string;
    role?: string;
    disabled?: boolean;
    disabled_reason?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const userId = body.userId?.trim();
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  if (userId === auth.user!.id && body.disabled === true) {
    return NextResponse.json(
      { error: "You cannot disable your own account" },
      { status: 400 }
    );
  }
  if (userId === auth.user!.id && body.role && body.role !== "admin") {
    return NextResponse.json(
      { error: "You cannot remove your own admin role" },
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

  if (body.role !== undefined) {
    if (!ROLES.has(body.role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    const { data, error } = await admin
      .from("profiles")
      .update({ role: body.role })
      .eq("id", userId)
      .select("id, display_name, role, created_at")
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    await writeAdminAudit({
      actorId: auth.user!.id,
      action: "role.change",
      targetType: "user",
      targetId: userId,
      meta: { role: body.role },
    });
    return NextResponse.json({ user: data });
  }

  if (body.disabled !== undefined) {
    const disabled = body.disabled;
    const reason = body.disabled_reason?.trim()?.slice(0, 500) || null;

    const { error: banError } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: disabled ? "876000h" : "none",
    });
    if (banError) {
      return NextResponse.json({ error: banError.message }, { status: 500 });
    }

    const profileUpdate: Record<string, unknown> = {
      disabled_at: disabled ? new Date().toISOString() : null,
      disabled_reason: disabled ? reason : null,
    };
    const { data, error } = await admin
      .from("profiles")
      .update(profileUpdate)
      .eq("id", userId)
      .select("id, display_name, role, created_at, disabled_at, disabled_reason")
      .single();

    // If columns missing, still report auth ban success
    if (error && !error.message.includes("disabled_at")) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await writeAdminAudit({
      actorId: auth.user!.id,
      action: disabled ? "user.ban" : "user.unban",
      targetType: "user",
      targetId: userId,
      meta: { reason },
    });

    return NextResponse.json({
      user: data ?? { id: userId, disabled },
      ok: true,
    });
  }

  return NextResponse.json(
    { error: "Provide role or disabled" },
    { status: 400 }
  );
}
