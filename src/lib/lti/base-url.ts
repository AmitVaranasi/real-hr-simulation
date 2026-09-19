/**
 * Our own base URL, used to build the launch redirect_uri we hand to the
 * platform. Prefer an explicit env var (required in production, where the
 * request's Host header shouldn't be trusted for this) and fall back to the
 * incoming request's origin for local/dev convenience.
 */
export function getToolBaseUrl(request: Request): string {
  const configured = process.env.LTI_TOOL_BASE_URL;
  if (configured) return configured.replace(/\/$/, "");
  return new URL(request.url).origin;
}
