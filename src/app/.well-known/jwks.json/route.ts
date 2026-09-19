import { NextResponse } from "next/server";
import { getToolJwk } from "@/lib/lti/keys";

/**
 * Our JWKS: the public half of the key we use to sign deep-linking
 * responses and the AGS client_credentials assertion. Canvas fetches this
 * when it needs to verify something *we* signed (deep linking responses are
 * verified by the platform, not by us).
 */
export async function GET() {
  try {
    const jwk = await getToolJwk();
    return NextResponse.json(
      { keys: [jwk] },
      { headers: { "Cache-Control": "public, max-age=300" } }
    );
  } catch {
    // No LTI keys configured (e.g. local dev without LTI env vars) — return
    // an empty key set rather than a 500 so the app keeps building/running.
    return NextResponse.json({ keys: [] });
  }
}
