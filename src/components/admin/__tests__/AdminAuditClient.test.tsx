import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminAuditClient } from "../AdminAuditClient";

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body } as Response;
}

describe("AdminAuditClient", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows a loading row while the fetch is pending", () => {
    (fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));
    render(<AdminAuditClient />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("shows an empty state when there are no audit entries", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({ entries: [] })
    );
    render(<AdminAuditClient />);
    expect(await screen.findByText("No audit entries yet.")).toBeInTheDocument();
  });

  it("shows the error banner only when there are no entries to fall back on", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({ error: "Partial outage", entries: [] })
    );
    render(<AdminAuditClient />);
    expect(await screen.findByText("Partial outage")).toBeInTheDocument();
  });

  it("suppresses the error banner when entries did come back despite the error field", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({
        error: "Stale cache warning",
        entries: [
          {
            id: "a1",
            actor_id: "u1",
            actor_name: "Casey Lee",
            action: "role.update",
            target_type: "user",
            target_id: "u2",
            meta: {},
            created_at: "2026-01-01T00:00:00Z",
          },
        ],
      })
    );
    render(<AdminAuditClient />);
    await screen.findByText("Casey Lee");
    expect(screen.queryByText("Stale cache warning")).not.toBeInTheDocument();
  });

  it("renders a populated table with actor, action and target columns", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({
        entries: [
          {
            id: "a1",
            actor_id: "u1",
            actor_name: "Casey Lee",
            action: "user.disable",
            target_type: "user",
            target_id: "abcdefabcdef1234",
            meta: {},
            created_at: "2026-01-01T00:00:00Z",
          },
          {
            id: "a2",
            actor_id: null,
            actor_name: null,
            action: "config.restore",
            target_type: null,
            target_id: null,
            meta: {},
            created_at: "2026-01-02T00:00:00Z",
          },
        ],
      })
    );
    render(<AdminAuditClient />);
    await screen.findByText("Casey Lee");

    expect(screen.getByText("user.disable")).toBeInTheDocument();
    expect(screen.getByText("user · abcdefabcdef")).toBeInTheDocument();
    expect(screen.getByText("config.restore")).toBeInTheDocument();

    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(3);
  });

  it("shows a generic error banner when the request throws", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("network down"));
    render(<AdminAuditClient />);
    expect(
      await screen.findByText("Failed to load audit log")
    ).toBeInTheDocument();
  });
});
