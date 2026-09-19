import { createLocalJWKSet, type JSONWebKeySet, type JWTVerifyGetKey } from "jose";

/**
 * Bounded fetch + cache of a platform's JWKS. The URL always comes from our
 * own `lti_platforms` registration row — never from the incoming token —
 * so an attacker cannot point verification at a key set they control.
 */

const FETCH_TIMEOUT_MS = 5000;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

interface CacheEntry {
  jwks: JSONWebKeySet;
  fetchedAt: number;
}

const cache = new Map<string, CacheEntry>();

async function fetchJwks(url: string): Promise<JSONWebKeySet> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "manual", // no unbounded redirect chains — a redirect is a hard failure
      headers: { Accept: "application/json" },
    });
    if (res.status >= 300 && res.status < 400) {
      throw new Error(`JWKS fetch got a redirect (status ${res.status}); refusing to follow`);
    }
    if (!res.ok) {
      throw new Error(`JWKS fetch failed with status ${res.status}`);
    }
    const body = (await res.json()) as JSONWebKeySet;
    if (!Array.isArray(body.keys)) {
      throw new Error("JWKS response missing keys array");
    }
    return body;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Returns a jose GetKeyFunction resolving keys from the platform's cached
 * JWKS, keyed by the platform's own record id (not the URL) so a stale cache
 * entry can't survive a registration edit that changes the URL.
 */
export async function getJwksResolver(
  platformId: string,
  jwksUrl: string
): Promise<JWTVerifyGetKey> {
  const cached = cache.get(platformId);
  const fresh = cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS;
  const jwks = fresh ? cached.jwks : await fetchJwks(jwksUrl);
  if (!fresh) {
    cache.set(platformId, { jwks, fetchedAt: Date.now() });
  }
  return createLocalJWKSet(jwks);
}

export function clearJwksCache(platformId?: string): void {
  if (platformId) {
    cache.delete(platformId);
  } else {
    cache.clear();
  }
}
