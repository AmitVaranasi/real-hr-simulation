import { SignJWT } from "jose";
import crypto from "node:crypto";
import { getKeyId, getToolPrivateKey, TOOL_KEY_ALG } from "./keys";
import { createAdminClient } from "@/lib/supabase/admin";
import type { LtiPlatformRegistration } from "./types";

/**
 * LTI Advantage Assignment & Grade Services (AGS): client-credentials token
 * acquisition, line item find-or-create, and score POST. Canvas is the only
 * platform this is built against, but nothing here is Canvas-specific
 * beyond the URLs coming from the registration row.
 */

const AGS_SCOPE_LINEITEM = "https://purl.imsglobal.org/spec/lti-ags/scope/lineitem";
const AGS_SCOPE_SCORE = "https://purl.imsglobal.org/spec/lti-ags/scope/score";
const AGS_SCOPES = [AGS_SCOPE_LINEITEM, AGS_SCOPE_SCORE].join(" ");

const FETCH_TIMEOUT_MS = 8000;

interface CachedToken {
  accessToken: string;
  expiresAt: number; // epoch ms
}

const tokenCache = new Map<string, CachedToken>();
// 60s safety margin so a token that's about to expire isn't handed out and
// then rejected mid-request by the platform.
const EXPIRY_MARGIN_MS = 60_000;

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Obtains (and caches, honoring token expiry) an OAuth2 client-credentials
 * access token for AGS calls, authenticated via a signed JWT assertion
 * (RFC 7523) rather than a shared client secret — the standard, more secure
 * LTI Advantage service-authentication mechanism.
 */
export async function getAgsAccessToken(platform: LtiPlatformRegistration): Promise<string> {
  const cached = tokenCache.get(platform.id);
  if (cached && cached.expiresAt - EXPIRY_MARGIN_MS > Date.now()) {
    return cached.accessToken;
  }

  const privateKey = await getToolPrivateKey();
  const now = Math.floor(Date.now() / 1000);
  const assertion = await new SignJWT({
    sub: platform.client_id,
    iss: platform.client_id,
    aud: platform.auth_token_url,
    jti: crypto.randomUUID(),
  })
    .setProtectedHeader({ alg: TOOL_KEY_ALG, kid: getKeyId() })
    .setIssuedAt(now)
    .setExpirationTime(now + 300)
    .sign(privateKey);

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
    client_assertion: assertion,
    scope: AGS_SCOPES,
  });

  const res = await fetchWithTimeout(platform.auth_token_url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    throw new Error(`AGS token request failed with status ${res.status}`);
  }
  const json = (await res.json()) as { access_token: string; expires_in: number };
  const accessToken = json.access_token;
  const expiresAt = Date.now() + json.expires_in * 1000;
  tokenCache.set(platform.id, { accessToken, expiresAt });
  return accessToken;
}

export function clearAgsTokenCache(platformId?: string): void {
  if (platformId) tokenCache.delete(platformId);
  else tokenCache.clear();
}

interface LineItem {
  id: string; // the lineitem URL itself
  label: string;
  scoreMaximum: number;
  resourceLinkId?: string;
  resourceId?: string;
}

/**
 * Finds an existing line item scoped to this resource_link_id, or creates
 * one, caching the result in lti_line_items so future rounds don't re-hit
 * the AGS lineitems endpoint.
 */
export async function findOrCreateLineItem(params: {
  platform: LtiPlatformRegistration;
  lineitemsUrl: string;
  resourceLinkRowId: string; // our lti_resource_links.id
  resourceLinkId: string; // Canvas's resource_link_id
  teamId?: string | null;
  label: string;
  scoreMaximum: number;
}): Promise<string> {
  const admin = createAdminClient();
  const { data: cached } = await admin
    .from("lti_line_items")
    .select("lineitem_url")
    .eq("resource_link_id", params.resourceLinkRowId)
    .eq("team_id", params.teamId ?? null)
    .maybeSingle();
  if (cached?.lineitem_url) return cached.lineitem_url as string;

  const token = await getAgsAccessToken(params.platform);

  const listUrl = new URL(params.lineitemsUrl);
  listUrl.searchParams.set("resource_link_id", params.resourceLinkId);
  const listRes = await fetchWithTimeout(listUrl.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.ims.lis.v2.lineitemcontainer+json",
    },
  });
  if (listRes.ok) {
    const items = (await listRes.json()) as LineItem[];
    const existing = items.find((li) => li.resourceLinkId === params.resourceLinkId);
    if (existing?.id) {
      await admin.from("lti_line_items").insert({
        resource_link_id: params.resourceLinkRowId,
        team_id: params.teamId ?? null,
        lineitem_url: existing.id,
      });
      return existing.id;
    }
  }

  const createRes = await fetchWithTimeout(params.lineitemsUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/vnd.ims.lis.v2.lineitem+json",
    },
    body: JSON.stringify({
      scoreMaximum: params.scoreMaximum,
      label: params.label,
      resourceLinkId: params.resourceLinkId,
    }),
  });
  if (!createRes.ok) {
    throw new Error(`AGS line item creation failed with status ${createRes.status}`);
  }
  const created = (await createRes.json()) as LineItem;
  await admin.from("lti_line_items").insert({
    resource_link_id: params.resourceLinkRowId,
    team_id: params.teamId ?? null,
    lineitem_url: created.id,
  });
  return created.id;
}

export type GradingProgress = "FullyGraded" | "Pending" | "PendingManual" | "Failed" | "NotReady";
export type ActivityProgress = "Initialized" | "Started" | "InProgress" | "Submitted" | "Completed";

/**
 * Posts a score for one student against a line item. Canvas maps this to
 * the gradebook cell for that assignment/user. `userId` must be the LTI
 * `sub` of the student (not our internal profile id) — that's what AGS
 * scopes scores by.
 */
export async function postScore(params: {
  platform: LtiPlatformRegistration;
  lineitemUrl: string;
  userId: string;
  scoreGiven: number;
  scoreMaximum: number;
  activityProgress?: ActivityProgress;
  gradingProgress?: GradingProgress;
}): Promise<void> {
  const token = await getAgsAccessToken(params.platform);
  const scoresUrl = `${params.lineitemUrl.replace(/\/$/, "")}/scores`;
  const res = await fetchWithTimeout(scoresUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/vnd.ims.lis.v1.score+json",
    },
    body: JSON.stringify({
      userId: params.userId,
      scoreGiven: params.scoreGiven,
      scoreMaximum: params.scoreMaximum,
      activityProgress: params.activityProgress ?? "Completed",
      gradingProgress: params.gradingProgress ?? "FullyGraded",
      timestamp: new Date().toISOString(),
    }),
  });
  if (!res.ok) {
    throw new Error(`AGS score POST failed with status ${res.status}`);
  }
}
