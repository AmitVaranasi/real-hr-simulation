import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import type { Profile } from "@/lib/engine/types";
import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

function adminEmailAllowlist(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Promote allowlisted emails to admin via service role (once).
 * Safe to call on every authenticated request — no-ops when already admin
 * or when email is not listed.
 */
export async function maybePromoteAdminFromAllowlist(
  user: User | null,
  profile: Profile | null
): Promise<Profile | null> {
  if (!user?.email || !profile) return profile;
  if (profile.role === "admin") return profile;

  const allow = adminEmailAllowlist();
  if (!allow.includes(user.email.toLowerCase())) return profile;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", user.id)
      .select("*")
      .single();
    if (error || !data) return profile;
    return data as Profile;
  } catch {
    return profile;
  }
}

export async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return { user: null, profile: null, supabase };

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  let profile = profileRow as Profile | null;
  profile = await maybePromoteAdminFromAllowlist(user, profile);

  return {
    user,
    profile,
    supabase,
  };
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function requireInstructor() {
  const auth = await getAuthUser();
  if (!auth.user) return { error: unauthorized(), ...auth };
  if (auth.profile?.role !== "instructor") {
    return { error: forbidden(), ...auth };
  }
  return { error: null, ...auth };
}

/** Instructors and admins (global config / testing tools). */
export async function requireInstructorOrAdmin() {
  const auth = await getAuthUser();
  if (!auth.user) return { error: unauthorized(), ...auth };
  const role = auth.profile?.role;
  if (role !== "instructor" && role !== "admin") {
    return { error: forbidden(), ...auth };
  }
  return { error: null, ...auth };
}

export async function requireAdmin() {
  const auth = await getAuthUser();
  if (!auth.user) return { error: unauthorized(), ...auth };
  if (auth.profile?.role !== "admin") {
    return { error: forbidden(), ...auth };
  }
  return { error: null, ...auth };
}

export async function requireAuth() {
  const auth = await getAuthUser();
  if (!auth.user) return { error: unauthorized(), ...auth };
  return { error: null, ...auth };
}

export type AuthBundle = {
  user: User | null;
  profile: Profile | null;
  supabase: SupabaseClient;
};
