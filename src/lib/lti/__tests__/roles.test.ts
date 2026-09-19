import { describe, expect, it } from "vitest";
import { mapLtiRolesToLocalRole } from "../roles";

describe("mapLtiRolesToLocalRole", () => {
  it("maps an Instructor role to instructor", () => {
    expect(
      mapLtiRolesToLocalRole([
        "http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor",
      ])
    ).toBe("instructor");
  });

  it("maps a TeachingAssistant role to instructor", () => {
    expect(
      mapLtiRolesToLocalRole([
        "http://purl.imsglobal.org/vocab/lis/v2/membership#TeachingAssistant",
      ])
    ).toBe("instructor");
  });

  it("maps a Learner-only role list to student", () => {
    expect(
      mapLtiRolesToLocalRole(["http://purl.imsglobal.org/vocab/lis/v2/membership#Learner"])
    ).toBe("student");
  });

  it("defaults to student when roles is undefined", () => {
    expect(mapLtiRolesToLocalRole(undefined)).toBe("student");
  });

  it("defaults to student when roles is empty", () => {
    expect(mapLtiRolesToLocalRole([])).toBe("student");
  });

  it("maps mixed roles containing Instructor to instructor", () => {
    expect(
      mapLtiRolesToLocalRole([
        "http://purl.imsglobal.org/vocab/lis/v2/membership#Learner",
        "http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor",
      ])
    ).toBe("instructor");
  });
});
