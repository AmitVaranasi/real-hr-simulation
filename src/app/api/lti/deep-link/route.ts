import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireInstructor } from "@/lib/api/auth";
import { findPlatformById } from "@/lib/lti/platform-registry";
import { signDeepLinkingResponse } from "@/lib/lti/deep-link";
import { getToolBaseUrl } from "@/lib/lti/base-url";
import { DEEP_LINK_CONTEXT_COOKIE } from "@/lib/lti/deep-link-cookie";

interface DeepLinkContext {
  platformId: string;
  deepLinkingSettings?: {
    deep_link_return_url: string;
  };
}

/**
 * Completes a deep-linking placement: the instructor has picked one of
 * their own simulation sessions to place into a Canvas assignment, so we
 * build the target_link_uri (our own launch endpoint, encoding which
 * session this placement is for), sign an LtiDeepLinkingResponse with it,
 * and hand back an auto-submitting form the client POSTs to Canvas's
 * deep_link_return_url.
 *
 * The deep-linking settings (return URL) come only from the HttpOnly cookie
 * set at /api/lti/launch from the verified id_token — never from anything
 * the client could supply on this request.
 */
export async function POST(request: Request) {
  const { error, supabase, user } = await requireInstructor();
  if (error) return error;

  const body = await request.json();
  const sessionId = body.sessionId;
  if (typeof sessionId !== "string" || !sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  const { data: session } = await supabase
    .from("sessions")
    .select("id, name")
    .eq("id", sessionId)
    .eq("instructor_id", user!.id)
    .single();
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const cookieStore = await cookies();
  const raw = cookieStore.get(DEEP_LINK_CONTEXT_COOKIE)?.value;
  if (!raw) {
    return NextResponse.json(
      { error: "No pending deep-linking request. Launch this from Canvas's assignment picker." },
      { status: 400 }
    );
  }
  let ctx: DeepLinkContext;
  try {
    ctx = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Corrupt deep-linking context" }, { status: 400 });
  }

  const platform = await findPlatformById(ctx.platformId);
  const returnUrl = ctx.deepLinkingSettings?.deep_link_return_url;
  if (!platform || !returnUrl) {
    return NextResponse.json({ error: "Invalid deep-linking context" }, { status: 400 });
  }
  // Only ever hand this instructor's own platform registration back — the
  // cookie's platformId is server-set, but double-check ownership anyway.
  if (platform.instructor_id !== user!.id) {
    return NextResponse.json({ error: "Platform does not belong to this instructor" }, {
      status: 403,
    });
  }

  const baseUrl = getToolBaseUrl(request);
  const resourceUrl = `${baseUrl}/lti/launch-target?session=${encodeURIComponent(sessionId)}`;

  const jwt = await signDeepLinkingResponse({
    platform,
    deployIdAudience: platform.client_id,
    resourceUrl,
    title: session.name,
    scoreMaximum: 100,
  });

  cookieStore.delete(DEEP_LINK_CONTEXT_COOKIE);

  return NextResponse.json({ returnUrl, jwt });
}
