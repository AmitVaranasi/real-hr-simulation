import { describe, expect, it } from "vitest";
import {
  isTutorialGatedPath,
  safeNextPath,
  tutorialStatus,
} from "@/lib/student/tutorial";

describe("isTutorialGatedPath", () => {
  it("locks the student portal", () => {
    for (const p of [
      "/dashboard",
      "/dashboard/getting-started",
      "/decisions",
      "/round/abc/decisions",
      "/review",
      "/reports/workforce-brief",
      "/team/members",
      "/resources",
      "/help/faq",
      "/history",
      "/leaderboard",
    ]) {
      expect(isTutorialGatedPath(p), p).toBe(true);
    }
  });

  it("leaves joining, the tutorial and other portals open", () => {
    for (const p of [
      "/join",
      "/join/ABC123",
      "/tutorial",
      "/sessions",
      "/admin",
      "/login",
      "/dashboards-other",
    ]) {
      expect(isTutorialGatedPath(p), p).toBe(false);
    }
  });
});

describe("tutorialStatus", () => {
  it("reads completed and skipped", () => {
    expect(tutorialStatus({ tutorial_status: "completed" })).toBe("completed");
    expect(tutorialStatus({ tutorial_status: "skipped" })).toBe("skipped");
  });

  it("treats anything else as not done", () => {
    expect(tutorialStatus(undefined)).toBeNull();
    expect(tutorialStatus({})).toBeNull();
    expect(tutorialStatus({ tutorial_status: "yes" })).toBeNull();
  });
});

describe("safeNextPath", () => {
  it("keeps same-site paths", () => {
    expect(safeNextPath("/round/abc/decisions?tab=dei")).toBe(
      "/round/abc/decisions?tab=dei"
    );
  });

  it("falls back to the dashboard for unsafe or looping targets", () => {
    expect(safeNextPath(undefined)).toBe("/dashboard");
    expect(safeNextPath("https://evil.example")).toBe("/dashboard");
    expect(safeNextPath("//evil.example")).toBe("/dashboard");
    expect(safeNextPath("/tutorial")).toBe("/dashboard");
    expect(safeNextPath("/tutorial?next=/x")).toBe("/dashboard");
  });
});
