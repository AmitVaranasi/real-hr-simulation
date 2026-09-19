import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decodeJwt } from "jose";
import { findPlatformByIssuerAndClientId } from "@/lib/lti/platform-registry";
import { getJwksResolver } from "@/lib/lti/jwks-client";
import { consumeNonceWithState } from "@/lib/lti/nonce-store";
import { verifyLtiLaunch } from "@/lib/lti/verifier";
import { establishSessionForLaunch } from "@/lib/lti/session";
import { DEEP_LINK_CONTEXT_COOKIE } from "@/lib/lti/deep-link-cookie";
import {
  CLAIM_DEEP_LINKING_SETTINGS,
  CLAIM_MESSAGE_TYPE,
  CLAIM_RESOURCE_LINK,
  LTI_MESSAGE_TYPE_DEEP_LINKING,
} from "@/lib/lti/types";

/**
 * LTI 1.3 launch callback (step 2 of 2). This endpoint is UNAUTHENTICATED
 * and accepts a token from an outside party — it is the most attackable
 * surface of the app. Every claim is verified before it is trusted; see
 * src/lib/lti/verifier.ts for the exhaustive checklist and its hostile-input
 * test suite.
 *
 * The raw id_token is never logged (not even on error paths) — only the
 * structured LtiVerifyFailureReason is.
 */
export async function POST(request: Request) {
  const formData = await request.formData();
  const idToken = formData.get("id_token");
  const state = formData.get("state");

  if (typeof idToken !== "string" || typeof state !== "string" || !idToken || !state) {
    return NextResponse.json({ error: "Missing id_token or state" }, { status: 400 });
  }

  // Decoding here reads the token's claims WITHOUT verifying the signature.
  // The only thing this unverified read is used for is selecting which
  // already-registered platform to verify against — never anything else.
  let unverifiedIss: string | undefined;
  let unverifiedAudCandidates: string[] = [];
  try {
    const unverified = decodeJwt(idToken);
    unverifiedIss = typeof unverified.iss === "string" ? unverified.iss : undefined;
    unverifiedAudCandidates = Array.isArray(unverified.aud)
      ? unverified.aud.filter((a): a is string => typeof a === "string")
      : typeof unverified.aud === "string"
        ? [unverified.aud]
        : [];
  } catch {
    return NextResponse.json({ error: "Malformed id_token" }, { status: 400 });
  }

  if (!unverifiedIss || unverifiedAudCandidates.length === 0) {
    return NextResponse.json({ error: "Malformed id_token" }, { status: 400 });
  }

  let platform = null;
  for (const clientId of unverifiedAudCandidates) {
    platform = await findPlatformByIssuerAndClientId(unverifiedIss, clientId);
    if (platform) break;
  }
  if (!platform) {
    return NextResponse.json({ error: "Unknown or unregistered LTI platform" }, { status: 403 });
  }

  let resolveKey;
  try {
    resolveKey = await getJwksResolver(platform.id, platform.jwks_url);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch platform JWKS", reason: "jwks_fetch_failed" },
      { status: 502 }
    );
  }

  const result = await verifyLtiLaunch(idToken, platform, {
    resolveKey,
    consumeNonce: (nonce) => consumeNonceWithState(nonce, state),
  });

  if (!result.ok || !result.claims) {
    return NextResponse.json(
      { error: "LTI launch rejected", reason: result.reason },
      { status: 401 }
    );
  }

  const claims = result.claims;

  let session;
  try {
    session = await establishSessionForLaunch(claims, platform);
  } catch {
    return NextResponse.json({ error: "Failed to establish session" }, { status: 500 });
  }

  const baseUrl = (process.env.LTI_TOOL_BASE_URL ?? new URL(request.url).origin).replace(
    /\/$/,
    ""
  );

  if (claims[CLAIM_MESSAGE_TYPE] === LTI_MESSAGE_TYPE_DEEP_LINKING) {
    // Deep linking settings (return URL, accepted types) come from this
    // already-verified token, not from anything the browser could tamper
    // with afterward. Stashed in a short-lived, HttpOnly cookie for the
    // placement page to read server-side, since the redirect drops the POST
    // body.
    const deepLinkingSettings = claims[CLAIM_DEEP_LINKING_SETTINGS];
    const cookieStore = await cookies();
    cookieStore.set(DEEP_LINK_CONTEXT_COOKIE, JSON.stringify({
      platformId: platform.id,
      deepLinkingSettings,
    }), {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 600,
      path: "/lti/deep-link",
    });
    return NextResponse.redirect(`${baseUrl}/lti/deep-link`, { status: 303 });
  }

  const resourceLink = claims[CLAIM_RESOURCE_LINK];
  const resourceLinkId = resourceLink?.id;
  const dest = resourceLinkId
    ? `${baseUrl}/lti/resource/${encodeURIComponent(platform.id)}/${encodeURIComponent(resourceLinkId)}`
    : session.role === "instructor"
      ? `${baseUrl}/sessions`
      : `${baseUrl}/dashboard`;

  return NextResponse.redirect(dest, { status: 303 });
}
