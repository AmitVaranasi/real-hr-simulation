import { createAdminClient } from "@/lib/supabase/admin";

export type AuditAction =
  | "role.change"
  | "user.ban"
  | "user.unban"
  | "user.reset_password"
  | "user.impersonate"
  | "user.impersonate_exit"
  | "config.save"
  | "config.reset"
  | "config.restore"
  | "config.snapshot"
  | "formula.note_update";

export async function writeAdminAudit(opts: {
  actorId: string | null;
  action: AuditAction | string;
  targetType?: string | null;
  targetId?: string | null;
  meta?: Record<string, unknown>;
}) {
  try {
    const admin = createAdminClient();
    await admin.from("admin_audit_log").insert({
      actor_id: opts.actorId,
      action: opts.action,
      target_type: opts.targetType ?? null,
      target_id: opts.targetId ?? null,
      meta: opts.meta ?? {},
    });
  } catch {
    // Audit must never break primary admin actions
  }
}
