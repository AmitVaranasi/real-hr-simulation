import { NextResponse } from "next/server";
import { requireInstructor } from "@/lib/api/auth";

/** Instructor-facing CRUD for their own LTI platform registrations. */
export async function GET() {
  const { error, supabase, user } = await requireInstructor();
  if (error) return error;

  const { data, error: dbError } = await supabase
    .from("lti_platforms")
    .select("*")
    .eq("instructor_id", user!.id)
    .order("created_at", { ascending: false });
  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }
  return NextResponse.json({ platforms: data });
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export async function POST(request: Request) {
  const { error, supabase, user } = await requireInstructor();
  if (error) return error;

  const body = await request.json();
  const required = [
    "name",
    "issuer",
    "client_id",
    "deployment_id",
    "auth_login_url",
    "auth_token_url",
    "jwks_url",
  ];
  for (const field of required) {
    if (!isNonEmptyString(body[field])) {
      return NextResponse.json({ error: `Missing or invalid field: ${field}` }, { status: 400 });
    }
  }

  const { data, error: dbError } = await supabase
    .from("lti_platforms")
    .insert({
      instructor_id: user!.id,
      name: body.name,
      issuer: body.issuer,
      client_id: body.client_id,
      deployment_id: body.deployment_id,
      auth_login_url: body.auth_login_url,
      auth_token_url: body.auth_token_url,
      jwks_url: body.jwks_url,
    })
    .select("*")
    .single();
  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 400 });
  }
  return NextResponse.json({ platform: data }, { status: 201 });
}
