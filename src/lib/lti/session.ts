import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { CLAIM_ROLES, type LtiLaunchClaims, type LtiPlatformRegistration } from "./types";
import { mapLtiRolesToLocalRole } from "./roles";

/**
 * Finds or creates the local profile for an LTI launch subject, then
 * establishes a real Supabase Auth session for it (so downstream
 * requireAuth/requireInstructor from src/lib/api/auth.ts work unmodified).
 *
 * Identity mapping is (platform_id, lti_sub) -> profile, per the LTI spec
 * (`sub` is only unique within an issuer/platform, never globally). A new
 * launch from a never-seen sub creates a synthetic auth user — LTI users
 * never set a password, they only ever arrive via a verified launch.
 */
export async function establishSessionForLaunch(
  claims: LtiLaunchClaims,
  platform: LtiPlatformRegistration
): Promise<{ profileId: string; role: "instructor" | "student" }> {
  const admin = createAdminClient();
  const role = mapLtiRolesToLocalRole(claims[CLAIM_ROLES] as string[] | undefined);
  const displayName =
    (typeof claims.name === "string" && claims.name) ||
    (typeof claims.email === "string" && claims.email) ||
    `LTI user ${claims.sub.slice(0, 8)}`;

  const { data: existingIdentity } = await admin
    .from("lti_identities")
    .select("*")
    .eq("platform_id", platform.id)
    .eq("lti_sub", claims.sub)
    .maybeSingle();

  let profileId: string;
  let authEmail: string;

  if (existingIdentity) {
    profileId = existingIdentity.profile_id;
    const { data: authUser } = await admin.auth.admin.getUserById(profileId);
    if (!authUser?.user?.email) {
      throw new Error("LTI identity references a profile with no auth user");
    }
    authEmail = authUser.user.email;

    await admin
      .from("lti_identities")
      .update({ roles: (claims[CLAIM_ROLES] as string[]) ?? [], updated_at: new Date().toISOString() })
      .eq("id", existingIdentity.id);
    await admin.from("profiles").update({ role, display_name: displayName }).eq("id", profileId);
  } else {
    // Synthetic, never-user-visible address — only used as an Auth key, LTI
    // users authenticate exclusively via a verified launch, never a
    // password or magic link email.
    authEmail = `lti+${platform.id}+${claims.sub}@lti.local`;
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: authEmail,
      email_confirm: true,
      user_metadata: { lti_platform_id: platform.id, lti_sub: claims.sub },
    });
    if (createError || !created?.user) {
      throw new Error(`Failed to create auth user for LTI launch: ${createError?.message}`);
    }
    profileId = created.user.id;

    await admin.from("profiles").insert({
      id: profileId,
      role,
      display_name: displayName,
    });
    await admin.from("lti_identities").insert({
      platform_id: platform.id,
      lti_sub: claims.sub,
      profile_id: profileId,
      roles: (claims[CLAIM_ROLES] as string[]) ?? [],
    });
  }

  // Passwordless server-side sign-in: generate a magic link (never emailed —
  // we already know the user is legitimate, having just verified the LTI
  // launch signature) purely to obtain a verifiable OTP token hash, then
  // redeem it immediately against the request's own cookie jar.
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: authEmail,
  });
  if (linkError || !linkData?.properties?.hashed_token) {
    throw new Error(`Failed to generate LTI session link: ${linkError?.message}`);
  }

  const supabase = await createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: linkData.properties.hashed_token,
  });
  if (verifyError) {
    throw new Error(`Failed to establish LTI session: ${verifyError.message}`);
  }

  return { profileId, role };
}
