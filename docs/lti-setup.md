# LTI 1.3 / LTI Advantage setup (Canvas)

**Status: un-certified.** This integration has never been exercised against a
real Canvas instance — there was no developer key or network access to one
available while building it. Everything below is implemented against the
public LTI 1.3 / LTI Advantage spec and tested with fixture tokens signed by
a locally generated RSA keypair (see `src/lib/lti/__tests__/verifier.test.ts`).
Treat a first real Canvas connection as a pilot, not a rollout — see
"What remains unverified" at the bottom.

Canvas is the only platform supported. The Canvas-specific pieces (its exact
JWKS/OIDC endpoint shapes, its AGS quirks) are isolated to
`src/lib/lti/*` and the `lti_platforms` table so adding Blackboard/Moodle
later is a new registration row and (if needed) small platform-specific
branches, not a rewrite.

## Environment variables

| Var | Required | Purpose |
|---|---|---|
| `LTI_TOOL_PRIVATE_KEY` | Yes, for any LTI feature | PKCS8 PEM RSA private key. Never commit this. Used to sign deep-linking responses and the AGS client-credentials JWT assertion. |
| `LTI_TOOL_PUBLIC_KEY` | Yes | SPKI PEM matching the private key. Published (as a JWK) at `/.well-known/jwks.json`. |
| `LTI_TOOL_KID` | No (defaults to `lti-tool-key-1`) | Key id embedded in signed tokens and the JWKS entry. Bump this and rotate the key pair together if you ever need to rotate. |
| `LTI_TOOL_BASE_URL` | Recommended in production | This app's own public origin (e.g. `https://simulation.example.edu`), used to build the launch `redirect_uri` and deep-linking `target_link_uri`. Falls back to the incoming request's origin if unset, which is fine for local dev but should be pinned explicitly in production. |

None of these are required for `next build` or for any feature outside LTI —
the JWKS endpoint returns an empty key set and any LTI route that needs a
key throws a clear error at request time, not at build time.

Generate a key pair once, e.g.:

```
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out lti-private.pem
openssl rsa -pubout -in lti-private.pem -out lti-public.pem
```

Paste the PEM contents into `LTI_TOOL_PRIVATE_KEY` / `LTI_TOOL_PUBLIC_KEY` as
your hosting provider's env-var UI supports (literal newlines or `\n`
escapes are both accepted).

## Migration

Apply `supabase/migration-v14-lti.sql`. It adds:

- `lti_platforms` — one row per Canvas instance/deployment an instructor connects
- `lti_nonces` — single-use, expiring OIDC nonces
- `lti_resource_links` — Canvas assignment placement → simulation session
- `lti_line_items` — cached AGS line item URLs
- `lti_identities` — LTI `sub` (scoped by platform) → local profile

## What an instructor gives Canvas, and what we give them

An instructor registers a **Developer Key** (LTI 1.3 / LTI Advantage type)
in Canvas admin, or asks their Canvas admin to. Canvas needs:

| Canvas field | Value |
|---|---|
| Redirect URIs / OIDC Redirect URI | `https://<your-domain>/api/lti/launch` |
| OpenID Connect Initiation URL | `https://<your-domain>/api/lti/login` |
| Target Link URI | `https://<your-domain>/api/lti/launch` (Canvas launches use the redirect URI; this is mostly informational) |
| JWK URL / Public JWK | `https://<your-domain>/.well-known/jwks.json` |
| LTI Advantage Services | Assignment and Grade Services (line item, score) — check the scopes your Developer Key grants |

Canvas then gives the instructor, after creating the key:

- **Issuer (`iss`)** — Canvas's OIDC issuer, typically `https://<canvas-domain>` or `https://canvas.instructure.com`
- **Client ID** — a numeric or opaque string tied to the Developer Key
- **Deployment ID** — assigned when the key is installed into a course/account

The instructor enters these (plus Canvas's own OIDC auth endpoint, token
endpoint, and JWKS URL — all published on Canvas's own
`/api/lti/security/jwks` and `.well-known/openid-configuration` per
instance) into our **Platform Registrations** screen
(`POST /api/lti/platforms`, one row per Canvas instance/deployment). This
step is required before any launch is trusted — an unregistered
`iss`/`client_id` pair is rejected before we ever look at anything else in
the token.

### Flow, end to end

1. Instructor places the tool as an External Tool assignment/link in Canvas.
2. Canvas → `GET/POST /api/lti/login` with `iss`, `client_id`, `login_hint`.
   We look up the registration, issue a nonce+state, redirect to Canvas's
   own auth endpoint.
3. Canvas → `POST /api/lti/launch` with a signed `id_token` and our `state`.
   We verify everything (see below), find/create a local profile keyed by
   `(platform, sub)`, sign the student/instructor into a real session, and
   redirect into the app.
4. **Deep linking** (placing a specific session into an assignment):
   `LtiDeepLinkingRequest` lands the instructor on `/lti/deep-link`, where
   they pick one of their sessions; we sign an `LtiDeepLinkingResponse`
   content item pointing back at our launch endpoint with that session's id
   embedded, and auto-submit it to Canvas's `deep_link_return_url`.
5. **Grade passback**: `POST /api/lti/ags/sync/[sessionId]` (instructor
   triggered — not yet wired to run automatically on round close) obtains an
   AGS access token via a client-credentials grant signed with our tool key,
   finds/creates a line item per placement, and posts each team's current
   leaderboard score to every team member who has actually launched via
   that platform.

## Security checklist — what's implemented

The launch endpoint (`POST /api/lti/launch`) is unauthenticated and accepts
a token from an outside party. Every claim is verified before it is
trusted (`src/lib/lti/verifier.ts`, tested exhaustively in
`src/lib/lti/__tests__/verifier.test.ts`):

| Check | Failure mode if skipped | Rejection reason |
|---|---|---|
| `alg` is RS256, never `none` or HMAC | Attacker mints an unsigned or self-signed token | `alg_none_or_unsupported` |
| Signature verifies against the **registered** platform's JWKS | Forged token accepted | `signature_invalid` |
| `exp` in the future | Replay of an old, otherwise-valid token indefinitely | `expired` |
| `iat` not implausibly in the future | Clock-skew or forged token accepted | `issued_in_future` |
| `iss` matches the resolved registration | Cross-tenant confusion | `unregistered_issuer` |
| `aud` contains our `client_id`; `azp` matches when `aud` has multiple values | Token meant for a different tool accepted | `aud_mismatch` / `azp_mismatch` |
| `nonce` present and **atomically consumed** (deleted, not just checked) | Captured launch replayed | `nonce_missing` / `nonce_invalid_or_replayed` |
| `deployment_id` matches the registration | Wrong deployment's launch accepted | `deployment_id_missing` / `deployment_id_mismatch` |
| `message_type` is a known LTI message | Malformed/unexpected message processed | `wrong_message_type` |
| LTI `version` is `1.3.0` | Downgrade to an unsupported version | `wrong_lti_version` |

Additional hardening:

- The JWKS URL used to verify a launch **always** comes from the
  `lti_platforms` row selected by `(iss, client_id)` — never from the
  token itself — so a token can't redirect verification to an
  attacker-controlled key set (`src/lib/lti/jwks-client.ts`).
- That JWKS fetch has a 5s timeout, refuses to follow redirects (any 3xx is
  a hard failure), and is cached 10 minutes per platform id.
- The raw `id_token` and the tool's private key are never logged anywhere,
  including on rejection paths.
- Nonce consumption is a single `DELETE ... RETURNING`-style query; a
  database error is treated as "invalid", never as "valid" (fail closed).

## What remains unverified before production

This has **not** been run against a real Canvas instance. Specifically
unverified:

1. **Exact Canvas JWKS/claim shapes.** The verifier and role mapping are
   built from the public LTI 1.3 / LTI Advantage spec and Canvas's public
   documentation, not from a captured real launch. Canvas is generally
   spec-compliant, but field presence/naming edge cases (e.g. exact roles
   claim values, custom claims) could differ from what's assumed here.
2. **AGS line item / score payload acceptance.** `src/lib/lti/ags.ts` is
   unit-testable in isolation but its HTTP calls have never round-tripped
   against Canvas's actual AGS endpoints.
3. **Deep-linking content item acceptance.** The signed
   `LtiDeepLinkingResponse` has never been submitted to a real
   `deep_link_return_url`; Canvas's exact validation (content item schema,
   required fields) is unconfirmed.
4. **Token expiry/refresh behavior under real load** — the AGS token cache
   logic is exercised by unit tests with fake clocks only.
5. **Passwordless session establishment** uses Supabase's admin
   `generateLink` + `verifyOtp` as a server-side sign-in mechanism; this is
   a supported Supabase pattern but has not been load-tested for LTI's
   launch volume/latency expectations (many students launching within
   seconds of each other at the start of a class).
6. **Automatic grade passback on round close** is not implemented — sync is
   instructor-triggered via `POST /api/lti/ags/sync/[sessionId]` only.

Before a real pilot: get a Canvas test/developer instance (via Canvas's free
developer keys on a test Canvas Cloud/Canvas Free-for-Teacher account is the
cheapest path), register a real Developer Key, and walk the full flow once
end-to-end with a throwaway course before trusting it with real students.
