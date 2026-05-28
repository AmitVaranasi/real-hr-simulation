import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { Profile } from "@/lib/engine/types";

export async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return { user: null, profile: null, supabase };
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  return {
    user,
    profile: profile as Profile | null,
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

export async function requireAuth() {
  const auth = await getAuthUser();
  if (!auth.user) return { error: unauthorized(), ...auth };
  return { error: null, ...auth };
}
