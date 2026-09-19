import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "node:crypto";

const NONCE_TTL_MS = 10 * 60 * 1000; // 10 minutes — generous for an OIDC round trip

/** Issues and persists a fresh nonce + state pair for the OIDC login step. */
export async function issueNonce(
  platformId: string
): Promise<{ nonce: string; state: string }> {
  const nonce = crypto.randomUUID();
  const state = crypto.randomUUID();
  const admin = createAdminClient();
  const { error } = await admin.from("lti_nonces").insert({
    nonce,
    state,
    platform_id: platformId,
    expires_at: new Date(Date.now() + NONCE_TTL_MS).toISOString(),
  });
  if (error) {
    throw new Error(`Failed to persist LTI nonce: ${error.message}`);
  }
  return { nonce, state };
}

/**
 * Atomically consumes (burns) a nonce: deletes the row and reports whether a
 * row was actually deleted. A second call with the same nonce — including a
 * genuine replay attack — finds nothing to delete and returns false.
 * Expired-but-undeleted rows are also rejected, so a stale unexpired-looking
 * cache entry can't be reused after its TTL.
 */
export async function consumeNonce(nonce: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("lti_nonces")
    .delete()
    .eq("nonce", nonce)
    .gt("expires_at", new Date().toISOString())
    .select("nonce");
  if (error) {
    // Fail closed: a db error must never be treated as "nonce is valid".
    return false;
  }
  return Array.isArray(data) && data.length === 1;
}

/**
 * Same as {@link consumeNonce} but additionally requires the OIDC `state`
 * param returned by the platform to match the state we issued alongside
 * this nonce — ties the launch back to the specific login round trip we
 * started, not just any still-valid nonce.
 */
export async function consumeNonceWithState(nonce: string, state: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("lti_nonces")
    .delete()
    .eq("nonce", nonce)
    .eq("state", state)
    .gt("expires_at", new Date().toISOString())
    .select("nonce");
  if (error) return false;
  return Array.isArray(data) && data.length === 1;
}

/** Best-effort cleanup of long-expired nonces; safe to call opportunistically. */
export async function pruneExpiredNonces(): Promise<void> {
  const admin = createAdminClient();
  await admin.from("lti_nonces").delete().lt("expires_at", new Date().toISOString());
}
