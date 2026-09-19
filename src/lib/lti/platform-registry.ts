import { createAdminClient } from "@/lib/supabase/admin";
import type { LtiPlatformRegistration } from "./types";

/**
 * Looks up a registered platform by (iss, client_id). This is the ONLY
 * thing an unverified `iss`/`client_id` from an incoming request is ever
 * used for: selecting which registration (and therefore which JWKS URL) to
 * verify against. Nothing is trusted from the token until the signature
 * checks out against the resolved registration's own JWKS.
 */
export async function findPlatformByIssuerAndClientId(
  iss: string,
  clientId: string
): Promise<LtiPlatformRegistration | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("lti_platforms")
    .select("*")
    .eq("issuer", iss)
    .eq("client_id", clientId)
    .maybeSingle();
  if (error || !data) return null;
  return data as LtiPlatformRegistration;
}

export async function findPlatformById(
  id: string
): Promise<LtiPlatformRegistration | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("lti_platforms")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as LtiPlatformRegistration;
}
