import { SignJWT } from "jose";
import { getKeyId, getToolPrivateKey, TOOL_KEY_ALG } from "./keys";
import type { LtiPlatformRegistration } from "./types";

interface ContentItem {
  type: "ltiResourceLink";
  title: string;
  url: string;
  lineItem?: {
    scoreMaximum: number;
    label: string;
    resourceId?: string;
  };
}

/**
 * Builds and signs an LtiDeepLinkingResponse JWT so an instructor can place
 * a specific simulation session into a Canvas assignment. Canvas verifies
 * this against our JWKS (GET /.well-known/jwks.json) — the signature is
 * what makes the placement trustworthy from Canvas's side.
 */
export async function signDeepLinkingResponse(params: {
  platform: LtiPlatformRegistration;
  deployIdAudience: string; // our own client_id, echoed back as aud
  resourceUrl: string;
  title: string;
  scoreMaximum?: number;
}): Promise<string> {
  const privateKey = await getToolPrivateKey();
  const now = Math.floor(Date.now() / 1000);

  const contentItem: ContentItem = {
    type: "ltiResourceLink",
    title: params.title,
    url: params.resourceUrl,
    ...(params.scoreMaximum
      ? { lineItem: { scoreMaximum: params.scoreMaximum, label: params.title } }
      : {}),
  };

  return new SignJWT({
    iss: params.deployIdAudience,
    aud: params.platform.issuer,
    "https://purl.imsglobal.org/spec/lti/claim/deployment_id": params.platform.deployment_id,
    "https://purl.imsglobal.org/spec/lti/claim/message_type": "LtiDeepLinkingResponse",
    "https://purl.imsglobal.org/spec/lti/claim/version": "1.3.0",
    "https://purl.imsglobal.org/spec/lti-dl/claim/content_items": [contentItem],
  })
    .setProtectedHeader({ alg: TOOL_KEY_ALG, kid: getKeyId() })
    .setIssuedAt(now)
    .setExpirationTime(now + 300)
    .sign(privateKey);
}
