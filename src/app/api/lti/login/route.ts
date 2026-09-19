import { NextResponse } from "next/server";
import { findPlatformByIssuerAndClientId } from "@/lib/lti/platform-registry";
import { issueNonce } from "@/lib/lti/nonce-store";
import { getToolBaseUrl } from "@/lib/lti/base-url";

/**
 * LTI 1.3 OIDC third-party initiated login (step 1 of 2). Canvas hits this
 * with iss/login_hint/target_link_uri/client_id (GET or POST, per the LTI
 * spec both must be supported). We only trust iss+client_id to select an
 * ALREADY REGISTERED platform — nothing here establishes a session or reads
 * any user data; it just starts the OIDC round trip and redirects back to
 * Canvas's own auth endpoint with a nonce/state we'll verify at /launch.
 */
async function handleLogin(params: URLSearchParams, request: Request) {
  const iss = params.get("iss");
  const clientId = params.get("client_id");
  const loginHint = params.get("login_hint");
  const targetLinkUri = params.get("target_link_uri");
  const ltiMessageHint = params.get("lti_message_hint");

  if (!iss || !clientId || !loginHint) {
    return NextResponse.json(
      { error: "Missing required OIDC login parameters (iss, client_id, login_hint)" },
      { status: 400 }
    );
  }

  const platform = await findPlatformByIssuerAndClientId(iss, clientId);
  if (!platform) {
    // Deliberately generic — do not reveal whether iss or client_id was the
    // problem, and never fetch anything based on this iss before this point.
    return NextResponse.json({ error: "Unknown LTI platform" }, { status: 403 });
  }

  const { nonce, state } = await issueNonce(platform.id);

  const baseUrl = getToolBaseUrl(request);
  const redirectUri = `${baseUrl}/api/lti/launch`;

  const authUrl = new URL(platform.auth_login_url);
  authUrl.searchParams.set("scope", "openid");
  authUrl.searchParams.set("response_type", "id_token");
  authUrl.searchParams.set("client_id", platform.client_id);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("login_hint", loginHint);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("response_mode", "form_post");
  authUrl.searchParams.set("nonce", nonce);
  authUrl.searchParams.set("prompt", "none");
  if (ltiMessageHint) authUrl.searchParams.set("lti_message_hint", ltiMessageHint);
  if (targetLinkUri) authUrl.searchParams.set("target_link_uri", targetLinkUri);

  return NextResponse.redirect(authUrl.toString(), { status: 302 });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  return handleLogin(url.searchParams, request);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const params = new URLSearchParams();
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") params.set(key, value);
  }
  return handleLogin(params, request);
}
