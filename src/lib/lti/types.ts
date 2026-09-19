/** A registered LTI 1.3 platform deployment (one row of lti_platforms). */
export interface LtiPlatformRegistration {
  id: string;
  instructor_id: string;
  name: string;
  issuer: string;
  client_id: string;
  deployment_id: string;
  auth_login_url: string;
  auth_token_url: string;
  jwks_url: string;
}

export const LTI_MESSAGE_TYPE_RESOURCE_LINK = "LtiResourceLinkRequest";
export const LTI_MESSAGE_TYPE_DEEP_LINKING = "LtiDeepLinkingRequest";
export const LTI_VERSION = "1.3.0";

export const CLAIM_MESSAGE_TYPE = "https://purl.imsglobal.org/spec/lti/claim/message_type";
export const CLAIM_VERSION = "https://purl.imsglobal.org/spec/lti/claim/version";
export const CLAIM_DEPLOYMENT_ID = "https://purl.imsglobal.org/spec/lti/claim/deployment_id";
export const CLAIM_TARGET_LINK_URI = "https://purl.imsglobal.org/spec/lti/claim/target_link_uri";
export const CLAIM_RESOURCE_LINK = "https://purl.imsglobal.org/spec/lti/claim/resource_link";
export const CLAIM_ROLES = "https://purl.imsglobal.org/spec/lti/claim/roles";
export const CLAIM_CONTEXT = "https://purl.imsglobal.org/spec/lti/claim/context";
export const CLAIM_DEEP_LINKING_SETTINGS =
  "https://purl.imsglobal.org/spec/lti-dl/claim/deep_linking_settings";
export const CLAIM_AGS_ENDPOINT = "https://purl.imsglobal.org/spec/lti-ags/claim/endpoint";

export const INSTRUCTOR_ROLE_SUBSTRINGS = [
  "Instructor",
  "ContentDeveloper",
  "Administrator",
  "TeachingAssistant",
];

/** Minimal shape of the claims we rely on out of a verified LTI id_token. */
export interface LtiLaunchClaims {
  iss: string;
  aud: string | string[];
  sub: string;
  exp: number;
  iat: number;
  nonce: string;
  azp?: string;
  [CLAIM_MESSAGE_TYPE]: string;
  [CLAIM_VERSION]: string;
  [CLAIM_DEPLOYMENT_ID]: string;
  [CLAIM_TARGET_LINK_URI]?: string;
  [CLAIM_RESOURCE_LINK]?: { id: string; title?: string };
  [CLAIM_ROLES]?: string[];
  [CLAIM_CONTEXT]?: { id: string; label?: string; title?: string };
  [CLAIM_DEEP_LINKING_SETTINGS]?: {
    deep_link_return_url: string;
    accept_types: string[];
    accept_presentation_document_targets: string[];
    data?: string;
  };
  [CLAIM_AGS_ENDPOINT]?: {
    scope: string[];
    lineitems?: string;
    lineitem?: string;
  };
  name?: string;
  email?: string;
  [key: string]: unknown;
}

export type LtiVerifyFailureReason =
  | "malformed_token"
  | "alg_none_or_unsupported"
  | "unregistered_issuer"
  | "signature_invalid"
  | "expired"
  | "issued_in_future"
  | "aud_mismatch"
  | "azp_mismatch"
  | "nonce_missing"
  | "nonce_invalid_or_replayed"
  | "deployment_id_mismatch"
  | "deployment_id_missing"
  | "wrong_message_type"
  | "wrong_lti_version"
  | "jwks_fetch_failed";

export interface LtiVerifyResult {
  ok: boolean;
  claims?: LtiLaunchClaims;
  reason?: LtiVerifyFailureReason;
  detail?: string;
}
