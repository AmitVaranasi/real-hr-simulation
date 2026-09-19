import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminUsersClient } from "../AdminUsersClient";

const USERS = [
  {
    id: "u1",
    email: "alice@example.com",
    display_name: "Alice Chen",
    role: "student" as const,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "u2",
    email: "bob@example.com",
    display_name: "Bob Diaz",
    role: "instructor" as const,
    created_at: "2026-01-02T00:00:00Z",
    disabled: true,
    disabled_reason: "Left the course",
  },
];

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body } as Response;
}

describe("AdminUsersClient", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("shows a loading row while the initial fetch is pending", () => {
    (fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));
    render(<AdminUsersClient />);
    expect(screen.getByText("Loading users…")).toBeInTheDocument();
  });

  it("shows an empty state when no users are returned", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({ users: [] })
    );
    render(<AdminUsersClient />);
    expect(await screen.findByText("No users found.")).toBeInTheDocument();
  });

  it("shows the error banner when the load fails", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({ error: "Not authorized" }, false)
    );
    render(<AdminUsersClient />);
    expect(await screen.findByText("Not authorized")).toBeInTheDocument();
  });

  it("renders a populated table with role selects and status badges", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({ users: USERS })
    );
    render(<AdminUsersClient />);
    await screen.findByText("Alice Chen");

    const rows = screen.getAllByRole("row");
    // header + 2 data rows
    expect(rows).toHaveLength(3);
    expect(screen.getAllByRole("combobox")).toHaveLength(2);

    expect(screen.getByText("Disabled")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("filters the table by the search box across name, email and role", async () => {
    const user = userEvent.setup();
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({ users: USERS })
    );
    render(<AdminUsersClient />);
    await screen.findByText("Alice Chen");

    const search = screen.getByPlaceholderText("Search name, email, or role…");
    await user.type(search, "bob");

    expect(screen.queryByText("Alice Chen")).not.toBeInTheDocument();
    expect(screen.getByText("Bob Diaz")).toBeInTheDocument();
  });

  it("clears a stale error banner once a later action succeeds", async () => {
    const user = userEvent.setup();
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(jsonResponse({ users: [USERS[0]] }));
    render(<AdminUsersClient />);
    const row = (await screen.findByText("Alice Chen")).closest("tr")!;

    // First cause an error banner via a failed reset-password call.
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "Reset failed" }, false));
    await user.click(within(row).getByRole("button", { name: "Reset" }));
    expect(await screen.findByText("Reset failed")).toBeInTheDocument();

    // A subsequent successful role change must clear that stale error.
    fetchMock.mockResolvedValueOnce(jsonResponse({}));
    const select = within(row).getByRole("combobox");
    await user.selectOptions(select, "instructor");

    await waitFor(() => {
      expect(screen.queryByText("Reset failed")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Role updated")).toBeInTheDocument();
  });

  it("disables a user and shows a reason prompt, then confirms the status flips", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "prompt").mockReturnValue("Policy violation");
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(jsonResponse({ users: [USERS[0]] }));
    render(<AdminUsersClient />);
    await screen.findByText("Alice Chen");

    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        user: { ...USERS[0], disabled: true, disabled_reason: "Policy violation" },
      })
    );

    const row = screen.getByText("Alice Chen").closest("tr")!;
    await user.click(within(row).getByRole("button", { name: "Disable" }));

    expect(window.prompt).toHaveBeenCalled();
    await waitFor(() => {
      expect(within(row).getByText("Disabled")).toBeInTheDocument();
    });
    expect(screen.getByText("User disabled")).toBeInTheDocument();
  });

  it("surfaces an error and does not update state when disabling fails", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "prompt").mockReturnValue(null);
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(jsonResponse({ users: [USERS[0]] }));
    render(<AdminUsersClient />);
    await screen.findByText("Alice Chen");

    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "Update failed" }, false));

    const row = screen.getByText("Alice Chen").closest("tr")!;
    await user.click(within(row).getByRole("button", { name: "Disable" }));

    expect(await screen.findByText("Update failed")).toBeInTheDocument();
    expect(within(row).getByText("Active")).toBeInTheDocument();
  });

  it("asks for confirmation before impersonating and aborts if declined", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(jsonResponse({ users: [USERS[0]] }));
    render(<AdminUsersClient />);
    await screen.findByText("Alice Chen");

    const row = screen.getByText("Alice Chen").closest("tr")!;
    await user.click(within(row).getByRole("button", { name: "Impersonate" }));

    expect(window.confirm).toHaveBeenCalled();
    // Only the initial GET should have fired — no impersonate POST.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
