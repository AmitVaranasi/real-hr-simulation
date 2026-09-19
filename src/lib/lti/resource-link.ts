import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Records/looks up which simulation session a Canvas resource_link_id
 * (assignment placement) points at. The session id is read out of the
 * `target_link_uri` claim (a `?session=<uuid>` query param we ourselves put
 * on the deep-linking content item's URL) the FIRST time Canvas launches a
 * given resource_link_id, then cached in lti_resource_links so every later
 * launch of the same assignment is a plain lookup by (platform_id,
 * resource_link_id) — Canvas is guaranteed by the LTI Advantage spec to
 * reuse the same resource_link_id for the same placement.
 */
export async function resolveSessionForResourceLink(params: {
  platformId: string;
  resourceLinkId: string;
  targetLinkUri?: string;
  contextId?: string;
}): Promise<string | null> {
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("lti_resource_links")
    .select("session_id")
    .eq("platform_id", params.platformId)
    .eq("resource_link_id", params.resourceLinkId)
    .maybeSingle();
  if (existing) return existing.session_id as string;

  if (!params.targetLinkUri) return null;
  let sessionId: string | null = null;
  try {
    sessionId = new URL(params.targetLinkUri).searchParams.get("session");
  } catch {
    return null;
  }
  if (!sessionId) return null;

  const { error } = await admin.from("lti_resource_links").insert({
    platform_id: params.platformId,
    resource_link_id: params.resourceLinkId,
    session_id: sessionId,
    context_id: params.contextId ?? null,
  });
  // A concurrent first-launch race would trip the (platform_id,
  // resource_link_id) unique constraint — the row already exists in that
  // case, which is fine; just proceed with the sessionId we derived.
  if (error && error.code !== "23505") {
    return null;
  }
  return sessionId;
}
