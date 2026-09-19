import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminFormulasClient } from "../AdminFormulasClient";

const FORMULAS = [
  {
    id: "f1",
    category: "Budget",
    name: "Recruiting spend",
    expression: "base * 1.1",
    description: "Recruiting budget formula",
    sourceFile: "budget.ts",
    configKeys: ["recruit.base"],
    expression_override: null,
    admin_notes: null,
  },
  {
    id: "f2",
    category: "HR Metrics",
    name: "Turnover rate",
    expression: "leavers / headcount",
    description: "Turnover formula",
    sourceFile: "metrics.ts",
    configKeys: [],
    expression_override: null,
    admin_notes: "Watch for div/0",
  },
];

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body } as Response;
}

describe("AdminFormulasClient", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows a loading placeholder in the formula list while fetching", () => {
    (fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));
    render(<AdminFormulasClient />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("prompts to select a formula when none is selected yet", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({ formulas: [] })
    );
    render(<AdminFormulasClient />);
    expect(await screen.findByText("Select a formula.")).toBeInTheDocument();
  });

  it("shows the error banner when the load fails", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({ error: "Formulas unavailable" }, false)
    );
    render(<AdminFormulasClient />);
    expect(await screen.findByText("Formulas unavailable")).toBeInTheDocument();
  });

  it("auto-selects the first formula and shows its detail panel", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({ formulas: FORMULAS })
    );
    render(<AdminFormulasClient />);
    expect(
      await screen.findByRole("heading", { name: "Recruiting spend" })
    ).toBeInTheDocument();
    expect(screen.getByText("recruit.base")).toBeInTheDocument();
  });

  it("switches the detail panel when a different formula is clicked", async () => {
    const user = userEvent.setup();
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({ formulas: FORMULAS })
    );
    render(<AdminFormulasClient />);
    await screen.findByRole("heading", { name: "Recruiting spend" });

    await user.click(screen.getByRole("button", { name: /Turnover rate/ }));

    expect(
      screen.getByRole("heading", { name: "Turnover rate" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Recruiting spend" })
    ).not.toBeInTheDocument();
  });

  it("filters the formula list by category", async () => {
    const user = userEvent.setup();
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({ formulas: FORMULAS })
    );
    render(<AdminFormulasClient />);
    await screen.findByRole("heading", { name: "Recruiting spend" });

    await user.click(screen.getByRole("button", { name: "HR Metrics" }));

    expect(screen.getByRole("button", { name: /Turnover rate/ })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Recruiting spend/ })
    ).not.toBeInTheDocument();
  });

  it("saves documentation edits and reloads, showing a success message", async () => {
    const user = userEvent.setup();
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(jsonResponse({ formulas: FORMULAS }));
    render(<AdminFormulasClient />);
    await screen.findByRole("heading", { name: "Recruiting spend" });

    const notes = screen.getByLabelText("Admin notes");
    await user.type(notes, "Reviewed for pilot");

    fetchMock.mockResolvedValueOnce(jsonResponse({}));
    fetchMock.mockResolvedValueOnce(jsonResponse({ formulas: FORMULAS }));

    await user.click(screen.getByRole("button", { name: "Save documentation" }));

    expect(
      await screen.findByText("Formula documentation saved")
    ).toBeInTheDocument();

    const saveCall = fetchMock.mock.calls.find(
      ([, init]) => (init as RequestInit | undefined)?.method === "PATCH"
    );
    expect(saveCall).toBeDefined();
    const body = JSON.parse((saveCall![1] as RequestInit).body as string);
    expect(body.notes).toBe("Reviewed for pilot");
  });

  it("shows a save error and leaves the message banner empty", async () => {
    const user = userEvent.setup();
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(jsonResponse({ formulas: FORMULAS }));
    render(<AdminFormulasClient />);
    await screen.findByRole("heading", { name: "Recruiting spend" });

    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "Save rejected" }, false));
    await user.click(screen.getByRole("button", { name: "Save documentation" }));

    await waitFor(() => {
      expect(screen.getByText("Save rejected")).toBeInTheDocument();
    });
    expect(
      screen.queryByText("Formula documentation saved")
    ).not.toBeInTheDocument();
  });
});
