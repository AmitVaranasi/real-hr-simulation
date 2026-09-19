import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppShellNav } from "../AppShellNav";

let mockPathname = "/";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body } as Response;
}

describe("AppShellNav", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    mockPathname = "/";
  });

  it("renders nothing when there is no role", () => {
    const { container } = render(<AppShellNav role={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for a student on a non-student-nav path", () => {
    mockPathname = "/team";
    const { container } = render(<AppShellNav role="student" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for an instructor off the /sessions namespace", () => {
    mockPathname = "/dashboard";
    const { container } = render(<AppShellNav role="instructor" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the student role nav on a student dashboard path", () => {
    mockPathname = "/dashboard";
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({ openRound: null })
    );
    render(<AppShellNav role="student" />);
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Leaderboard" })).toBeInTheDocument();
  });

  it("adds Decisions/Review links once the open round loads for a student", async () => {
    mockPathname = "/dashboard";
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({ openRound: { id: "round-1" } })
    );
    render(<AppShellNav role="student" />);
    expect(
      await screen.findByRole("link", { name: "Decisions" })
    ).toHaveAttribute("href", "/round/round-1/decisions");
  });

  it("shows the professor role nav on a /sessions path without fetching", () => {
    mockPathname = "/sessions/manage";
    render(<AppShellNav role="instructor" />);
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });
});
