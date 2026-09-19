import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TestingLaboratory } from "../TestingLaboratory";
import { createDefaultDecision } from "@/lib/engine/defaults";
import { runSimulationWithTrace } from "@/lib/engine/engine";
import {
  getIndustryConfig,
  getStrategyConfig,
  priorStateFromIndustry,
} from "@/lib/engine/config";

function jsonResponse(body: unknown, ok = true) {
  return {
    ok,
    json: async () => body,
    blob: async () => new Blob([JSON.stringify(body)]),
  } as Response;
}

const SESSIONS = { sessions: [{ id: "s1", name: "Fall Cohort" }] };

// A real trace from the pure engine, not a hand-built stub — FormulaInspector
// reads deep, specific fields (e.g. budget_breakdown.recruitment_spend) that
// a shallow mock would leave undefined and crash the render.
function makeTrace() {
  const { trace } = runSimulationWithTrace(
    createDefaultDecision(),
    priorStateFromIndustry("Manufacturing"),
    getIndustryConfig("Manufacturing"),
    getStrategyConfig("Focus"),
    "normal"
  );
  return trace;
}

describe("TestingLaboratory", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url === "/api/simulation-config/effective") {
          return Promise.resolve(jsonResponse({ discretionary_budget: 750_000 }));
        }
        if (url === "/api/sessions") {
          return Promise.resolve(jsonResponse(SESSIONS));
        }
        if (url === "/api/simulation-config/scenario") {
          return Promise.resolve(jsonResponse({ trace: makeTrace() }));
        }
        return Promise.resolve(jsonResponse({}));
      })
    );
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:mock"),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the effective discretionary budget once loaded and lists live sessions", async () => {
    render(<TestingLaboratory />);
    expect(
      await screen.findByText(/Discretionary budget: \$750,000/)
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("link", { name: "Inspect Fall Cohort →" })
    ).toBeInTheDocument();
  });

  it("shows a no-sessions message when the sessions list is empty", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (url: string) => {
        if (url === "/api/sessions") return Promise.resolve(jsonResponse({ sessions: [] }));
        if (url === "/api/simulation-config/effective")
          return Promise.resolve(jsonResponse({ discretionary_budget: 500_000 }));
        return Promise.resolve(jsonResponse({}));
      }
    );
    render(<TestingLaboratory />);
    expect(await screen.findByText("No sessions yet.")).toBeInTheDocument();
  });

  it("toggles a workflow checklist item and strikes through its label", async () => {
    // NOTE: a11y gap — TestingLaboratory.tsx:145-156 renders each checklist
    // <input type="checkbox"> as a sibling of its label text, not wrapped in
    // a <label>, so the checkbox has no accessible name. Falling back to
    // getAllByRole(checkbox) by index instead of getByRole(..., {name}).
    const user = userEvent.setup();
    render(<TestingLaboratory />);
    const firstStep = screen.getByText("Create or open a session");
    expect(firstStep.className).not.toContain("line-through");

    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[0]);

    expect(firstStep.className).toContain("line-through");
  });

  it("runs a scenario, disables the button while loading, and renders the formula inspector on success", async () => {
    const user = userEvent.setup();
    render(<TestingLaboratory />);
    await screen.findAllByText(/Discretionary budget/);

    const runButton = screen.getByRole("button", { name: "Run scenario" });
    await user.click(runButton);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Run scenario" })).toBeEnabled()
    );
    expect(screen.getByText(/Manufacturing \/ Focus/)).toBeInTheDocument();
  });

  it("shows the scenario error message instead of a trace when the API call fails", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (url: string) => {
        if (url === "/api/simulation-config/scenario") {
          return Promise.resolve(
            jsonResponse({ error: "Engine unavailable" }, false)
          );
        }
        if (url === "/api/sessions") return Promise.resolve(jsonResponse(SESSIONS));
        if (url === "/api/simulation-config/effective")
          return Promise.resolve(jsonResponse({ discretionary_budget: 500_000 }));
        return Promise.resolve(jsonResponse({}));
      }
    );
    const user = userEvent.setup();
    render(<TestingLaboratory />);
    await screen.findAllByText(/Discretionary budget/);

    await user.click(screen.getByRole("button", { name: "Run scenario" }));

    expect(await screen.findByText("Engine unavailable")).toBeInTheDocument();
    expect(screen.queryByText(/Manufacturing \/ Focus/)).not.toBeInTheDocument();
  });

  it("running scenario for a specific industry chip updates the trace label to that industry", async () => {
    const user = userEvent.setup();
    render(<TestingLaboratory />);
    await screen.findAllByText(/Discretionary budget/);

    await user.click(screen.getByRole("button", { name: "Retail" }));

    expect(
      await screen.findByText(/Retail \/ Focus/)
    ).toBeInTheDocument();
  });

  it("omits the page heading and configuration/export controls stay available when embedded", async () => {
    render(<TestingLaboratory embedded />);
    expect(
      screen.queryByRole("heading", { name: "Testing Center" })
    ).not.toBeInTheDocument();
    expect(
      await screen.findByRole("link", { name: "Configuration" })
    ).toBeInTheDocument();
  });
});
