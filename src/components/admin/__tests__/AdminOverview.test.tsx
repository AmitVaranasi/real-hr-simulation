import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminOverview } from "../AdminOverview";

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body } as Response;
}

describe("AdminOverview", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows a placeholder dash for each tile before the counts load", () => {
    (fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));
    render(<AdminOverview />);
    // Four stat tiles, each defaulting to the em-dash placeholder.
    expect(screen.getAllByText("—")).toHaveLength(4);
  });

  it("renders the loaded counts into their matching tiles", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({
        counts: { users: 42, sessions: 5, teams: 11, instructors: 3 },
      })
    );
    render(<AdminOverview />);
    expect(await screen.findByText("42")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("11")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("shows an error banner when the overview fetch fails", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({ error: "Overview unavailable" }, false)
    );
    render(<AdminOverview />);
    expect(await screen.findByText("Overview unavailable")).toBeInTheDocument();
  });

  it("shows a generic error banner when the request throws", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("boom"));
    render(<AdminOverview />);
    expect(
      await screen.findByText("Failed to load overview")
    ).toBeInTheDocument();
  });

  it("renders quick-action links to every admin destination", () => {
    (fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));
    render(<AdminOverview />);
    expect(
      screen.getByRole("link", { name: /User Management/ })
    ).toHaveAttribute("href", "/admin/users");
    expect(
      screen.getByRole("link", { name: /Audit Log/ })
    ).toHaveAttribute("href", "/admin/audit");
  });
});
