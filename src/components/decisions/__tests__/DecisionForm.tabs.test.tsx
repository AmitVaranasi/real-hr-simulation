import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DecisionForm } from "../DecisionForm";

// DecisionForm reads `?tab=` via useSearchParams() and derives the active
// module from it. There is no click-to-switch tab strip rendered *inside*
// DecisionForm itself (confirmed by reading the component: `setActiveTab` is
// only ever called from the searchParams-driven effect) — module switching
// from within this component is deep-link-only. See NOTE below and the final
// report for the accessibility/functionality implications.

let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/round/r1/decisions",
  useSearchParams: () => mockSearchParams,
}));

function setTabParam(tab: string | null) {
  mockSearchParams = new URLSearchParams(tab ? { tab } : {});
}

beforeEach(() => {
  setTabParam(null);
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("DecisionForm tab / deep-link behaviour", () => {
  it("defaults to the Recruitment module (index 0) when there is no ?tab param", async () => {
    render(<DecisionForm industry="Manufacturing" strategy="Cost Leadership" hideRunButton />);
    expect(
      await screen.findByRole("heading", { level: 1, name: "Recruitment & Selection" })
    ).toBeInTheDocument();
    expect(screen.getByText("1. Hiring Needs")).toBeInTheDocument();
  });

  it("opens directly on the module named by ?tab=compensation", async () => {
    setTabParam("compensation");
    render(<DecisionForm industry="Manufacturing" strategy="Cost Leadership" hideRunButton />);
    expect(
      await screen.findByRole("heading", { level: 1, name: "Compensation & Benefits" })
    ).toBeInTheDocument();
    // Recruitment-only content must not be present once compensation is active.
    expect(screen.queryByText("1. Hiring Needs")).not.toBeInTheDocument();
    expect(screen.getByText("1. Salary Strategy by Role")).toBeInTheDocument();
  });

  it("maps every documented ?tab= key to its module heading", async () => {
    const cases: Array<[string, string]> = [
      ["recruitment", "Recruitment & Selection"],
      ["performance", "Performance Management"],
      ["training", "Training & Development"],
      ["relations", "Employee Relations"],
      ["compensation", "Compensation & Benefits"],
      ["org-design", "Org Design & Change"],
      ["dei", "DEI Initiatives"],
    ];
    for (const [tab, heading] of cases) {
      setTabParam(tab);
      const { unmount } = render(
        <DecisionForm industry="Manufacturing" strategy="Cost Leadership" hideRunButton />
      );
      expect(
        await screen.findByRole("heading", { level: 1, name: heading })
      ).toBeInTheDocument();
      unmount();
    }
  });

  it("falls back to the current/default module for an unrecognized ?tab value", async () => {
    setTabParam("not-a-real-module");
    render(<DecisionForm industry="Manufacturing" strategy="Cost Leadership" hideRunButton />);
    // TAB_KEYS.indexOf returns -1 for unknown values, and the effect only
    // calls setActiveTab when idx >= 0, so activeTab stays at its initial 0.
    expect(
      await screen.findByRole("heading", { level: 1, name: "Recruitment & Selection" })
    ).toBeInTheDocument();
  });

  it("shows a 'N of 7' module position indicator that tracks the active tab", async () => {
    setTabParam("training");
    render(<DecisionForm industry="Manufacturing" strategy="Cost Leadership" hideRunButton />);
    await screen.findByRole("heading", { level: 1, name: "Training & Development" });
    expect(screen.getByText(/3 of 7/)).toBeInTheDocument();
  });

  // NOTE: a11y gap — DecisionForm renders no tab list / tab buttons of its
  // own (no role="tablist", role="tab", or any element that calls
  // setActiveTab outside the ?tab= deep-link effect in DecisionForm.tsx
  // lines 397-415). A student using only this component has no in-page,
  // keyboard-operable way to move between the 7 modules; module switching
  // depends entirely on an external navigator (e.g. a sidebar in
  // DecisionWorkspace's page shell, outside this component's scope) driving
  // the URL's ?tab= query param. This test pins that no tablist exists today
  // rather than asserting one should — flagged prominently in the report.
  it("renders no in-component tab list (documents the current tab-strip gap)", async () => {
    render(<DecisionForm industry="Manufacturing" strategy="Cost Leadership" hideRunButton />);
    await screen.findByRole("heading", { level: 1, name: "Recruitment & Selection" });
    expect(screen.queryAllByRole("tab")).toHaveLength(0);
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });
});
