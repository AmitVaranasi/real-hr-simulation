import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminVersionsClient } from "../AdminVersionsClient";

const REVISIONS = [
  {
    id: "r1",
    note: "Pre-pilot baseline",
    source: "manual",
    created_at: "2026-01-01T00:00:00Z",
    created_by: "u1",
  },
];

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body } as Response;
}

describe("AdminVersionsClient", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows a loading row while the revisions fetch is pending", () => {
    (fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));
    render(<AdminVersionsClient />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("shows an empty state when there are no revisions yet", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({ revisions: [] })
    );
    render(<AdminVersionsClient />);
    expect(
      await screen.findByText("No revisions yet. Save config or take a snapshot.")
    ).toBeInTheDocument();
  });

  it("shows the error banner when the load fails outright", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({ error: "Versions unavailable" }, false)
    );
    render(<AdminVersionsClient />);
    expect(await screen.findByText("Versions unavailable")).toBeInTheDocument();
  });

  it("renders populated revision rows with a Restore action per row", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({ revisions: REVISIONS })
    );
    render(<AdminVersionsClient />);
    await screen.findByText("Pre-pilot baseline");
    expect(
      screen.getByRole("button", { name: "Restore" })
    ).toBeInTheDocument();
  });

  it("takes a snapshot with the entered note and clears the input on success", async () => {
    const user = userEvent.setup();
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(jsonResponse({ revisions: [] }));
    render(<AdminVersionsClient />);
    await screen.findByText("No revisions yet. Save config or take a snapshot.");

    const noteInput = screen.getByLabelText("Snapshot note");
    await user.type(noteInput, "Before finals week");

    fetchMock.mockResolvedValueOnce(jsonResponse({}));
    fetchMock.mockResolvedValueOnce(jsonResponse({ revisions: REVISIONS }));

    await user.click(screen.getByRole("button", { name: "Take snapshot" }));

    expect(await screen.findByText("Snapshot saved")).toBeInTheDocument();
    expect(noteInput).toHaveValue("");

    const snapshotCall = fetchMock.mock.calls.find(
      ([, init]) => (init as RequestInit | undefined)?.method === "POST"
    );
    const body = JSON.parse((snapshotCall![1] as RequestInit).body as string);
    expect(body).toEqual({ action: "snapshot", note: "Before finals week" });
  });

  it("asks for confirmation before restoring and aborts if declined", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(jsonResponse({ revisions: REVISIONS }));
    render(<AdminVersionsClient />);
    await screen.findByText("Pre-pilot baseline");

    await user.click(screen.getByRole("button", { name: "Restore" }));

    expect(window.confirm).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("restores on confirmation and shows the restored message after reload", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(jsonResponse({ revisions: REVISIONS }));
    render(<AdminVersionsClient />);
    await screen.findByText("Pre-pilot baseline");

    fetchMock.mockResolvedValueOnce(jsonResponse({}));
    fetchMock.mockResolvedValueOnce(jsonResponse({ revisions: REVISIONS }));

    await user.click(screen.getByRole("button", { name: "Restore" }));

    await waitFor(() => {
      expect(
        screen.getByText("Config restored — a new revision was recorded")
      ).toBeInTheDocument();
    });
  });
});
