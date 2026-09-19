import { compactVerify, decodeProtectedHeader, type JWTVerifyGetKey } from "jose";
import {
  CLAIM_DEPLOYMENT_ID,
  CLAIM_MESSAGE_TYPE,
  CLAIM_VERSION,
  LTI_MESSAGE_TYPE_DEEP_LINKING,
  LTI_MESSAGE_TYPE_RESOURCE_LINK,
  LTI_VERSION,
  type LtiLaunchClaims,
  type LtiPlatformRegistration,
  type LtiVerifyFailureReason,
  type LtiVerifyResult,
} from "./types";

/** Only RS256 is accepted. `none` and any symmetric alg are rejected before
 * a signature is even attempted — an attacker who controls the header alg
 * must not be able to downgrade verification. */
const ALLOWED_ALG = "RS256";

/** Small clock-skew allowance for `iat` in the future, matching common LTI
 * platform implementations. Kept tight (server clocks should agree closely)
 * so a genuinely forged future-dated token is still rejected. */
const IAT_FUTURE_TOLERANCE_SECONDS = 5;

function fail(reason: LtiVerifyFailureReason, detail?: string): LtiVerifyResult {
  return { ok: false, reason, detail };
}

export interface VerifyLtiLaunchDeps {
  /** Resolves the signing key for the token's header (kid), already scoped
   * to the platform's registered JWKS — never derived from the token. */
  resolveKey: JWTVerifyGetKey;
  /** Attempts to atomically consume (burn) a nonce. Must return false if the
   * nonce was never issued, already used, or expired. */
  consumeNonce: (nonce: string) => Promise<boolean>;
  /** Injectable clock for deterministic tests; defaults to Date.now(). */
  now?: () => number;
}

/**
 * Verifies an LTI 1.3 id_token against an already-registered platform.
 *
 * Pure with respect to network/db access: JWKS resolution and nonce
 * consumption are both injected, so this function is fully testable with
 * fixture tokens and an in-memory nonce store. The caller is responsible for
 * looking up `registration` by `iss` BEFORE calling this (and for never
 * treating an unregistered iss as anything but a hard rejection).
 */
export async function verifyLtiLaunch(
  idToken: string,
  registration: LtiPlatformRegistration,
  deps: VerifyLtiLaunchDeps
): Promise<LtiVerifyResult> {
  let header;
  try {
    header = decodeProtectedHeader(idToken);
  } catch (e) {
    return fail("malformed_token", e instanceof Error ? e.message : String(e));
  }

  if (!header.alg || header.alg === "none" || header.alg !== ALLOWED_ALG) {
    return fail("alg_none_or_unsupported", `alg=${String(header.alg)}`);
  }

  let payloadBytes: Uint8Array;
  try {
    const result = await compactVerify(idToken, deps.resolveKey);
    payloadBytes = result.payload;
  } catch (e) {
    return fail("signature_invalid", e instanceof Error ? e.message : String(e));
  }

  let claims: LtiLaunchClaims;
  try {
    claims = JSON.parse(new TextDecoder().decode(payloadBytes)) as LtiLaunchClaims;
  } catch (e) {
    return fail("malformed_token", e instanceof Error ? e.message : String(e));
  }

  const now = deps.now ? deps.now() : Math.floor(Date.now() / 1000);

  if (typeof claims.exp !== "number" || claims.exp <= now) {
    return fail("expired");
  }
  if (typeof claims.iat !== "number" || claims.iat > now + IAT_FUTURE_TOLERANCE_SECONDS) {
    return fail("issued_in_future");
  }

  if (claims.iss !== registration.issuer) {
    // The caller should have already selected `registration` by iss, so
    // reaching this means the token's iss doesn't match what was looked up
    // (e.g. a tampered payload after signing, or caller misuse).
    return fail("unregistered_issuer", "iss does not match resolved registration");
  }

  const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!aud.includes(registration.client_id)) {
    return fail("aud_mismatch");
  }
  // Per OIDC core: if aud has multiple values, azp is required and must
  // match our client_id.
  if (aud.length > 1) {
    if (!claims.azp || claims.azp !== registration.client_id) {
      return fail("azp_mismatch");
    }
  } else if (claims.azp && claims.azp !== registration.client_id) {
    return fail("azp_mismatch");
  }

  if (!claims.nonce || typeof claims.nonce !== "string") {
    return fail("nonce_missing");
  }
  const nonceOk = await deps.consumeNonce(claims.nonce);
  if (!nonceOk) {
    return fail("nonce_invalid_or_replayed");
  }

  const deploymentId = claims[CLAIM_DEPLOYMENT_ID];
  if (!deploymentId || typeof deploymentId !== "string") {
    return fail("deployment_id_missing");
  }
  if (deploymentId !== registration.deployment_id) {
    return fail("deployment_id_mismatch");
  }

  const messageType = claims[CLAIM_MESSAGE_TYPE];
  if (
    messageType !== LTI_MESSAGE_TYPE_RESOURCE_LINK &&
    messageType !== LTI_MESSAGE_TYPE_DEEP_LINKING
  ) {
    return fail("wrong_message_type", `message_type=${String(messageType)}`);
  }

  if (claims[CLAIM_VERSION] !== LTI_VERSION) {
    return fail("wrong_lti_version", `version=${String(claims[CLAIM_VERSION])}`);
  }

  return { ok: true, claims };
}
