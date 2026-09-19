import { INSTRUCTOR_ROLE_SUBSTRINGS } from "./types";

/**
 * Maps the LTI roles claim (a list of IMS role URNs/URIs, e.g.
 * "http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor") to our
 * two-role model. Any role containing "Instructor", "ContentDeveloper",
 * "Administrator" or "TeachingAssistant" is treated as instructor — Canvas
 * TAs get instructor-equivalent access in our tool since they can also see
 * the whole simulation. Anything else (including no roles at all) maps to
 * student, the safer default for an unauthenticated launch endpoint.
 */
export function mapLtiRolesToLocalRole(roles: string[] | undefined): "instructor" | "student" {
  if (!roles || roles.length === 0) return "student";
  const isInstructor = roles.some((role) =>
    INSTRUCTOR_ROLE_SUBSTRINGS.some((substr) => role.includes(substr))
  );
  return isInstructor ? "instructor" : "student";
}
