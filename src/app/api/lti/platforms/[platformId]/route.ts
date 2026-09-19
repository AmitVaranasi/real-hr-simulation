import { NextResponse } from "next/server";
import { requireInstructor } from "@/lib/api/auth";
import { clearJwksCache } from "@/lib/lti/jwks-client";
import { clearAgsTokenCache } from "@/lib/lti/ags";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ platformId: string }> }
) {
  const { platformId } = await params;
  const { error, supabase, user } = await requireInstructor();
  if (error) return error;

  const body = await request.json();
  const allowed: Record<string, unknown> = {};
  for (const field of [
    "name",
    "issuer",
    "client_id",
    "deployment_id",
    "auth_login_url",
    "auth_token_url",
    "jwks_url",
  ]) {
    if (typeof body[field] === "string" && body[field].trim().length > 0) {
      allowed[field] = body[field];
    }
  }
  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data, error: dbError } = await supabase
    .from("lti_platforms")
    .update(allowed)
    .eq("id", platformId)
    .eq("instructor_id", user!.id)
    .select("*")
    .single();
  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 404 });
  }

  // A URL/registration edit can invalidate cached JWKS or AGS tokens keyed
  // by this platform id — drop both rather than risk verifying against or
  // authenticating with stale endpoints.
  clearJwksCache(platformId);
  clearAgsTokenCache(platformId);

  return NextResponse.json({ platform: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ platformId: string }> }
) {
  const { platformId } = await params;
  const { error, supabase, user } = await requireInstructor();
  if (error) return error;

  const { error: dbError } = await supabase
    .from("lti_platforms")
    .delete()
    .eq("id", platformId)
    .eq("instructor_id", user!.id);
  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 400 });
  }

  clearJwksCache(platformId);
  clearAgsTokenCache(platformId);

  return NextResponse.json({ ok: true });
}
