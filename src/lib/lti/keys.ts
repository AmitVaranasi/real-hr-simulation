import { exportJWK, importPKCS8, importSPKI, type JWK } from "jose";

/**
 * Our tool's own signing key, used for:
 *  - signing this tool's JWKS entry (GET /.well-known/jwks.json)
 *  - signing LtiDeepLinkingResponse JWTs
 *  - signing the client_credentials JWT assertion for AGS token requests
 *
 * The private key never touches the database and is never logged. It is
 * supplied only via environment variables, PEM-encoded (PKCS8 for the
 * private key, SPKI for the public key), so it can be rotated by rotating
 * secrets rather than editing code.
 */

const ALG = "RS256";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required LTI env var: ${name}`);
  }
  return value;
}

function normalizePem(pem: string): string {
  // Allow the env var to store literal "\n" (common in .env files / hosting
  // dashboards that don't support real newlines).
  return pem.includes("\\n") ? pem.replace(/\\n/g, "\n") : pem;
}

export function getKeyId(): string {
  return process.env.LTI_TOOL_KID ?? "lti-tool-key-1";
}

let cachedPrivateKey: CryptoKey | null = null;
export async function getToolPrivateKey(): Promise<CryptoKey> {
  if (cachedPrivateKey) return cachedPrivateKey;
  const pem = normalizePem(requiredEnv("LTI_TOOL_PRIVATE_KEY"));
  cachedPrivateKey = await importPKCS8(pem, ALG);
  return cachedPrivateKey;
}

let cachedPublicKey: CryptoKey | null = null;
export async function getToolPublicKey(): Promise<CryptoKey> {
  if (cachedPublicKey) return cachedPublicKey;
  const pem = normalizePem(requiredEnv("LTI_TOOL_PUBLIC_KEY"));
  cachedPublicKey = await importSPKI(pem, ALG);
  return cachedPublicKey;
}

export async function getToolJwk(): Promise<JWK> {
  const publicKey = await getToolPublicKey();
  const jwk = await exportJWK(publicKey);
  return {
    ...jwk,
    kid: getKeyId(),
    alg: ALG,
    use: "sig",
  };
}

export const TOOL_KEY_ALG = ALG;
