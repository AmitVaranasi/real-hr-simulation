import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

import { cookies } from "next/headers";
import {
  rememberSelectedTeam,
  readSelectedTeamCookie,
  selectedTeamId,
} from "../selected-team";

describe("rememberSelectedTeam / readSelectedTeamCookie (client)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("is a no-op when document is unavailable (SSR)", () => {
    vi.stubGlobal("document", undefined);
    expect(() => rememberSelectedTeam("t1")).not.toThrow();
    expect(readSelectedTeamCookie()).toBeNull();
  });

  it("round-trips a team id through document.cookie, URL-encoded", () => {
    let cookieStr = "";
    vi.stubGlobal("document", {
      get cookie() {
        return cookieStr;
      },
      set cookie(value: string) {
        // real document.cookie setters append/update one cookie at a time;
        // this fake just captures the single cookie that gets set.
        cookieStr = value.split(";")[0];
      },
    });
    rememberSelectedTeam("team with spaces");
    expect(readSelectedTeamCookie()).toBe("team with spaces");
  });

  it("returns null when the cookie is absent", () => {
    vi.stubGlobal("document", { cookie: "" });
    expect(readSelectedTeamCookie()).toBeNull();
  });

  it("returns null when another cookie is present but not this one", () => {
    vi.stubGlobal("document", { cookie: "other_cookie=abc123" });
    expect(readSelectedTeamCookie()).toBeNull();
  });
});

describe("selectedTeamId (server)", () => {
  it("returns null when no cookie is set", async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: () => undefined,
    } as never);
    expect(await selectedTeamId(["a", "b"])).toBeNull();
  });

  it("returns the cookie value when it belongs to this course's teams", async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: () => ({ value: "team-a" }),
    } as never);
    expect(await selectedTeamId(["team-a", "team-b"])).toBe("team-a");
  });

  it("returns null for a stale team id from another course — must not leak across sessions", async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: () => ({ value: "team-from-another-course" }),
    } as never);
    expect(await selectedTeamId(["team-a", "team-b"])).toBeNull();
  });
});
