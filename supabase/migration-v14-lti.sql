-- Migration v14: LTI 1.3 / LTI Advantage support (Canvas).
--
-- Adds per-institution platform registrations, single-use nonces for replay
-- protection on the launch endpoint, a mapping from LTI launch context to a
-- simulation session/team, and cached AGS (grades) line items so score
-- passback doesn't have to re-discover the line item every round.
--
-- Canvas is the only platform this migration is built against; the schema is
-- intentionally generic LTI Advantage (issuer/client_id/deployment_id/JWKS)
-- so Blackboard/Moodle later is a new row, not a new table.

-- Platform (LMS) registration: one row per Canvas instance/deployment an
-- instructor connects. client_id + deployment_id together identify a single
-- LTI 1.3 tool deployment inside that instance, per the LTI Advantage spec.
CREATE TABLE IF NOT EXISTS public.lti_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  issuer TEXT NOT NULL,
  client_id TEXT NOT NULL,
  deployment_id TEXT NOT NULL,
  auth_login_url TEXT NOT NULL,
  auth_token_url TEXT NOT NULL,
  jwks_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (issuer, client_id, deployment_id)
);

COMMENT ON TABLE public.lti_platforms IS
  'One row per registered LTI 1.3 platform deployment (Canvas instance). The launch endpoint only trusts an iss/client_id/deployment_id triple that already has a row here.';
COMMENT ON COLUMN public.lti_platforms.jwks_url IS
  'Platform JWKS URL, taken from registration only — never from an incoming token — so the verifier cannot be pointed at an attacker-controlled key set.';

-- Single-use, expiring nonces for the OIDC login -> launch round trip.
-- A nonce is inserted at /api/lti/login and deleted (burned) the moment it is
-- consumed at /api/lti/launch; a second use of the same nonce fails to find
-- (and delete) a row and is rejected as a replay.
CREATE TABLE IF NOT EXISTS public.lti_nonces (
  nonce TEXT PRIMARY KEY,
  state TEXT NOT NULL,
  platform_id UUID NOT NULL REFERENCES public.lti_platforms(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

COMMENT ON TABLE public.lti_nonces IS
  'Single-use OIDC state/nonce pairs. Row is deleted on first successful launch verification; a replayed id_token with the same nonce has nothing to burn and is rejected.';

CREATE INDEX IF NOT EXISTS lti_nonces_expires_at_idx ON public.lti_nonces (expires_at);

-- Deep-linking placement: which simulation session/team a Canvas assignment
-- launch should resolve to, keyed by platform + Canvas resource_link_id.
CREATE TABLE IF NOT EXISTS public.lti_resource_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id UUID NOT NULL REFERENCES public.lti_platforms(id) ON DELETE CASCADE,
  resource_link_id TEXT NOT NULL,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  context_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (platform_id, resource_link_id)
);

COMMENT ON TABLE public.lti_resource_links IS
  'Maps a Canvas assignment (resource_link_id) placed via deep linking to one of our simulation sessions, so a resource launch knows which session to open.';

-- Cached AGS line item per resource link + team, so grade passback does not
-- re-discover / re-create a Canvas line item every round.
CREATE TABLE IF NOT EXISTS public.lti_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_link_id UUID NOT NULL REFERENCES public.lti_resource_links(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  lineitem_url TEXT NOT NULL,
  scores_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (resource_link_id, team_id)
);

COMMENT ON TABLE public.lti_line_items IS
  'Cached AGS line item URL per resource link (+ optional team), avoiding a line-item lookup/create round trip on every score post.';

-- Map an LTI launch (platform + LTI `sub`) to our local profile, and record
-- the last-seen Canvas roles so instructor-vs-student stays in sync.
CREATE TABLE IF NOT EXISTS public.lti_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id UUID NOT NULL REFERENCES public.lti_platforms(id) ON DELETE CASCADE,
  lti_sub TEXT NOT NULL,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  roles TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (platform_id, lti_sub)
);

COMMENT ON TABLE public.lti_identities IS
  'Maps an LTI launch subject (iss/sub pair, scoped by platform_id) to a local profile. sub is only unique within a platform per the LTI spec, so the uniqueness constraint is (platform_id, lti_sub), never lti_sub alone.';

-- RLS: all LTI tables are instructor/service-role only. Students never query
-- these directly; the launch/AGS routes use the service-role admin client.
ALTER TABLE public.lti_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lti_nonces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lti_resource_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lti_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lti_identities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lti_platforms_owner ON public.lti_platforms;
CREATE POLICY lti_platforms_owner ON public.lti_platforms
  FOR ALL USING (instructor_id = auth.uid()) WITH CHECK (instructor_id = auth.uid());

DROP POLICY IF EXISTS lti_resource_links_owner ON public.lti_resource_links;
CREATE POLICY lti_resource_links_owner ON public.lti_resource_links
  FOR ALL USING (
    platform_id IN (SELECT id FROM public.lti_platforms WHERE instructor_id = auth.uid())
  ) WITH CHECK (
    platform_id IN (SELECT id FROM public.lti_platforms WHERE instructor_id = auth.uid())
  );

DROP POLICY IF EXISTS lti_line_items_owner ON public.lti_line_items;
CREATE POLICY lti_line_items_owner ON public.lti_line_items
  FOR ALL USING (
    resource_link_id IN (
      SELECT rl.id FROM public.lti_resource_links rl
      JOIN public.lti_platforms p ON p.id = rl.platform_id
      WHERE p.instructor_id = auth.uid()
    )
  ) WITH CHECK (
    resource_link_id IN (
      SELECT rl.id FROM public.lti_resource_links rl
      JOIN public.lti_platforms p ON p.id = rl.platform_id
      WHERE p.instructor_id = auth.uid()
    )
  );

-- Nonces and identities are only ever read/written by the service-role
-- client from the unauthenticated launch endpoint (no user session exists
-- yet at that point in the flow), so no user-facing policy is granted.
DROP POLICY IF EXISTS lti_nonces_none ON public.lti_nonces;
CREATE POLICY lti_nonces_none ON public.lti_nonces FOR ALL USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS lti_identities_none ON public.lti_identities;
CREATE POLICY lti_identities_none ON public.lti_identities FOR ALL USING (false) WITH CHECK (false);
