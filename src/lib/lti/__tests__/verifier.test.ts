import { describe, expect, it, beforeAll, vi } from "vitest";
import { SignJWT, generateKeyPair, type CryptoKey, type JWTPayload } from "jose";
import { verifyLtiLaunch, type VerifyLtiLaunchDeps } from "../verifier";
import {
  CLAIM_DEPLOYMENT_ID,
  CLAIM_MESSAGE_TYPE,
  CLAIM_VERSION,
  LTI_MESSAGE_TYPE_RESOURCE_LINK,
  LTI_VERSION,
  type LtiPlatformRegistration,
} from "../types";

const registration: LtiPlatformRegistration = {
  id: "platform-1",
  instructor_id: "instructor-1",
  name: "Test Canvas",
  issuer: "https://canvas.test.instructure.com",
  client_id: "client-abc",
  deployment_id: "deployment-xyz",
  auth_login_url: "https://canvas.test.instructure.com/api/lti/authorize_redirect",
  auth_token_url: "https://canvas.test.instructure.com/login/oauth2/token",
  jwks_url: "https://canvas.test.instructure.com/api/lti/security/jwks",
};

let platformPrivateKey: CryptoKey;
let platformPublicKey: CryptoKey;
let wrongPrivateKey: CryptoKey;

const KID = "test-kid-1";

function baseClaims(overrides: Partial<JWTPayload & Record<string, unknown>> = {}) {
  const now = Math.floor(Date.now() / 1000);
  return {
    iss: registration.issuer,
    aud: registration.client_id,
    sub: "student-42",
    exp: now + 300,
    iat: now,
    nonce: `nonce-${Math.random().toString(36).slice(2)}`,
    [CLAIM_MESSAGE_TYPE]: LTI_MESSAGE_TYPE_RESOURCE_LINK,
    [CLAIM_VERSION]: LTI_VERSION,
    [CLAIM_DEPLOYMENT_ID]: registration.deployment_id,
    ...overrides,
  };
}

async function signWith(key: CryptoKey, claims: Record<string, unknown>, alg = "RS256") {
  return new SignJWT(claims).setProtectedHeader({ alg, kid: KID }).sign(key);
}

function freshNonceStore() {
  const issued = new Set<string>();
  const consumeNonce = vi.fn(async (nonce: string) => {
    if (!issued.has(nonce)) return false;
    issued.delete(nonce);
    return true;
  });
  return { issued, consumeNonce };
}

function depsFor(consumeNonce: VerifyLtiLaunchDeps["consumeNonce"]): VerifyLtiLaunchDeps {
  return {
    resolveKey: async () => platformPublicKey,
    consumeNonce,
  };
}

beforeAll(async () => {
  const platformKeys = await generateKeyPair("RS256");
  platformPrivateKey = platformKeys.privateKey;
  platformPublicKey = platformKeys.publicKey;
  const wrongKeys = await generateKeyPair("RS256");
  wrongPrivateKey = wrongKeys.privateKey;
});

describe("verifyLtiLaunch — valid launch", () => {
  it("accepts a correctly signed, fully valid launch and burns the nonce", async () => {
    const claims = baseClaims();
    const { issued, consumeNonce } = freshNonceStore();
    issued.add(claims.nonce);
    const token = await signWith(platformPrivateKey, claims);

    const result = await verifyLtiLaunch(token, registration, depsFor(consumeNonce));

    expect(result.ok).toBe(true);
    expect(result.claims?.sub).toBe("student-42");
    expect(consumeNonce).toHaveBeenCalledWith(claims.nonce);
    // A second use of the same token must fail — nonce store no longer has it.
    const replay = await verifyLtiLaunch(token, registration, depsFor(consumeNonce));
    expect(replay.ok).toBe(false);
    expect(replay.reason).toBe("nonce_invalid_or_replayed");
  });
});

describe("verifyLtiLaunch — hostile inputs", () => {
  it("rejects alg: none", async () => {
    const claims = baseClaims();
    // jose refuses to sign with alg none via SignJWT's HMAC/RSA path, so
    // build the unsigned compact token by hand: header.payload. (empty sig)
    const header = Buffer.from(JSON.stringify({ alg: "none", kid: KID })).toString(
      "base64url"
    );
    const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
    const token = `${header}.${payload}.`;
    const { consumeNonce } = freshNonceStore();

    const result = await verifyLtiLaunch(token, registration, depsFor(consumeNonce));
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("alg_none_or_unsupported");
  });

  it("rejects an unsupported alg (HS256)", async () => {
    const claims = baseClaims();
    const secret = new TextEncoder().encode("attacker-controlled-secret");
    const token = await new SignJWT(claims)
      .setProtectedHeader({ alg: "HS256" })
      .sign(secret);
    const { consumeNonce } = freshNonceStore();

    const result = await verifyLtiLaunch(token, registration, depsFor(consumeNonce));
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("alg_none_or_unsupported");
  });

  it("rejects a wrong signature (signed by a different key)", async () => {
    const claims = baseClaims();
    const token = await signWith(wrongPrivateKey, claims);
    const { issued, consumeNonce } = freshNonceStore();
    issued.add(claims.nonce);

    const result = await verifyLtiLaunch(token, registration, depsFor(consumeNonce));
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("signature_invalid");
  });

  it("rejects an expired token", async () => {
    const now = Math.floor(Date.now() / 1000);
    const claims = baseClaims({ iat: now - 1000, exp: now - 100 });
    const token = await signWith(platformPrivateKey, claims);
    const { issued, consumeNonce } = freshNonceStore();
    issued.add(claims.nonce);

    const result = await verifyLtiLaunch(token, registration, depsFor(consumeNonce));
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("expired");
  });

  it("rejects a token issued in the future", async () => {
    const now = Math.floor(Date.now() / 1000);
    const claims = baseClaims({ iat: now + 10_000, exp: now + 20_000 });
    const token = await signWith(platformPrivateKey, claims);
    const { issued, consumeNonce } = freshNonceStore();
    issued.add(claims.nonce);

    const result = await verifyLtiLaunch(token, registration, depsFor(consumeNonce));
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("issued_in_future");
  });

  it("rejects a replayed nonce", async () => {
    const claims = baseClaims();
    const token = await signWith(platformPrivateKey, claims);
    const { consumeNonce } = freshNonceStore(); // never issued -> consume fails

    const result = await verifyLtiLaunch(token, registration, depsFor(consumeNonce));
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("nonce_invalid_or_replayed");
  });

  it("rejects a wrong aud", async () => {
    const claims = baseClaims({ aud: "someone-elses-client-id" });
    const token = await signWith(platformPrivateKey, claims);
    const { issued, consumeNonce } = freshNonceStore();
    issued.add(claims.nonce);

    const result = await verifyLtiLaunch(token, registration, depsFor(consumeNonce));
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("aud_mismatch");
  });

  it("rejects an unregistered issuer (iss doesn't match the resolved registration)", async () => {
    const claims = baseClaims({ iss: "https://evil.example.com" });
    const token = await signWith(platformPrivateKey, claims);
    const { issued, consumeNonce } = freshNonceStore();
    issued.add(claims.nonce);

    const result = await verifyLtiLaunch(token, registration, depsFor(consumeNonce));
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("unregistered_issuer");
  });

  it("rejects a missing deployment id", async () => {
    const claims = baseClaims();
    delete (claims as Record<string, unknown>)[CLAIM_DEPLOYMENT_ID];
    const token = await signWith(platformPrivateKey, claims);
    const { issued, consumeNonce } = freshNonceStore();
    issued.add(claims.nonce);

    const result = await verifyLtiLaunch(token, registration, depsFor(consumeNonce));
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("deployment_id_missing");
  });

  it("rejects a mismatched deployment id", async () => {
    const claims = baseClaims({ [CLAIM_DEPLOYMENT_ID]: "some-other-deployment" });
    const token = await signWith(platformPrivateKey, claims);
    const { issued, consumeNonce } = freshNonceStore();
    issued.add(claims.nonce);

    const result = await verifyLtiLaunch(token, registration, depsFor(consumeNonce));
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("deployment_id_mismatch");
  });

  it("rejects a tampered payload (signature no longer matches)", async () => {
    const claims = baseClaims();
    const token = await signWith(platformPrivateKey, claims);
    const [header, , sig] = token.split(".");
    const tamperedPayload = Buffer.from(
      JSON.stringify({ ...claims, sub: "attacker-elevated-sub" })
    ).toString("base64url");
    const tampered = `${header}.${tamperedPayload}.${sig}`;
    const { issued, consumeNonce } = freshNonceStore();
    issued.add(claims.nonce);

    const result = await verifyLtiLaunch(tampered, registration, depsFor(consumeNonce));
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("signature_invalid");
  });

  it("rejects a malformed token", async () => {
    const { consumeNonce } = freshNonceStore();
    const result = await verifyLtiLaunch("not-a-jwt", registration, depsFor(consumeNonce));
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("malformed_token");
  });

  it("rejects the wrong message type", async () => {
    const claims = baseClaims({ [CLAIM_MESSAGE_TYPE]: "SomeOtherMessage" });
    const token = await signWith(platformPrivateKey, claims);
    const { issued, consumeNonce } = freshNonceStore();
    issued.add(claims.nonce);

    const result = await verifyLtiLaunch(token, registration, depsFor(consumeNonce));
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("wrong_message_type");
  });

  it("rejects the wrong lti version", async () => {
    const claims = baseClaims({ [CLAIM_VERSION]: "1.1.0" });
    const token = await signWith(platformPrivateKey, claims);
    const { issued, consumeNonce } = freshNonceStore();
    issued.add(claims.nonce);

    const result = await verifyLtiLaunch(token, registration, depsFor(consumeNonce));
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("wrong_lti_version");
  });

  it("rejects a missing nonce", async () => {
    const claims = baseClaims();
    delete (claims as Record<string, unknown>).nonce;
    const token = await signWith(platformPrivateKey, claims);
    const { consumeNonce } = freshNonceStore();

    const result = await verifyLtiLaunch(token, registration, depsFor(consumeNonce));
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("nonce_missing");
  });

  it("rejects azp mismatch when aud is an array without a matching azp", async () => {
    const claims = baseClaims({
      aud: [registration.client_id, "another-audience"],
      azp: "another-audience",
    });
    const token = await signWith(platformPrivateKey, claims);
    const { issued, consumeNonce } = freshNonceStore();
    issued.add(claims.nonce);

    const result = await verifyLtiLaunch(token, registration, depsFor(consumeNonce));
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("azp_mismatch");
  });
});
