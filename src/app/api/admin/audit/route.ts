import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(
    Number(searchParams.get("limit") ?? 100) || 100,
    200
  );

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Server is missing service role configuration" },
      { status: 500 }
    );
  }

  const { data, error } = await admin
    .from("admin_audit_log")
    .select(
      "id, actor_id, action, target_type, target_id, meta, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    const missing = error.message.toLowerCase().includes("admin_audit_log");
    return NextResponse.json(
      {
        error: missing
          ? "Run migration-v6-full-admin.sql to enable audit logs"
          : error.message,
        entries: [],
      },
      { status: missing ? 200 : 500 }
    );
  }

  const actorIds = [
    ...new Set(
      (data ?? []).map((e) => e.actor_id).filter(Boolean) as string[]
    ),
  ];
  let names = new Map<string, string>();
  if (actorIds.length) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, display_name")
      .in("id", actorIds);
    names = new Map(
      (profiles ?? []).map((p) => [p.id, p.display_name as string])
    );
  }

  return NextResponse.json({
    entries: (data ?? []).map((e) => ({
      ...e,
      actor_name: e.actor_id ? names.get(e.actor_id) ?? null : null,
    })),
  });
}
