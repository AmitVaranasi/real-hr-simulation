import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DecisionForm } from "../DecisionForm";

// DecisionForm never calls validateDecision() from src/lib/engine/validation.ts
// (confirmed by grep: the name doesn't appear anywhere in DecisionForm.tsx).
// The only "validation" a student sees while filling out the form is the
// soft-warning feed from generateWarnings(), rendered inside
// DecisionGuidance as <li><strong>{module}:</strong> {message}</li>. These
// tests exercise that live warning feed at the exact boundaries
// src/lib/engine/__tests__/validation.test.ts pins for the pure function,
// and separately document two real gaps this surfaces in the UI.

let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/round/r1/decisions",
  useSearchParams: () => mockSearchParams,
}));

beforeEach(() => {
  mockSearchParams = new URLSearchParams();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("DecisionForm live warning boundaries", () => {
  it("shows the below-market compensation warning once every role's band drops to -20%, and clears it back at 0%", async () => {
    mockSearchParams = new URLSearchParams({ tab: "compensation" });
    render(<DecisionForm industry="Manufacturing" strategy="Cost Leadership" hideRunButton />);
    await screen.findByRole("heading", { level: 1, name: "Compensation & Benefits" });

    expect(
      screen.queryByText(/Below-market salary bands may increase turnover/)
    ).not.toBeInTheDocument();

    const salarySection = screen
      .getByText("1. Salary Strategy by Role")
      .closest("section")!;
    for (const select of within(salarySection).getAllByRole("combobox")) {
      fireEvent.change(select, { target: { value: "-20" } });
    }

    expect(
      await screen.findByText(/Below-market salary bands may increase turnover/)
    ).toBeInTheDocument();

    for (const select of within(salarySection).getAllByRole("combobox")) {
      fireEvent.change(select, { target: { value: "0" } });
    }

    expect(
      screen.queryByText(/Below-market salary bands may increase turnover/)
    ).not.toBeInTheDocument();
  });

  it("shows the low-training-coverage warning inside 0-15% and not at the 15% boundary itself", async () => {
    mockSearchParams = new URLSearchParams({ tab: "training" });
    render(<DecisionForm industry="Manufacturing" strategy="Cost Leadership" hideRunButton />);
    await screen.findByRole("heading", { level: 1, name: "Training & Development" });

    const coverageCard = screen.getByText("2. Training Coverage").closest("section")!;
    const slider = within(coverageCard).getByRole("slider");

    fireEvent.change(slider, { target: { value: "10" } });
    expect(
      await screen.findByText(/Very low training coverage may reduce productivity/)
    ).toBeInTheDocument();

    fireEvent.change(slider, { target: { value: "15" } });
    expect(
      screen.queryByText(/Very low training coverage may reduce productivity/)
    ).not.toBeInTheDocument();
  });

  // NOTE: real defect — validateDecision()'s hard rule "Total positions to
  // fill must be between 0 and 50" (src/lib/engine/validation.ts:20-22) is
  // never invoked from DecisionForm, so a student can push the UI into that
  // invalid state (each role's stepper is independently capped at 20 by
  // `Math.min(20, ...)` in DecisionForm.tsx, so 3+ roles can exceed 50
  // combined) with zero feedback of any kind — no warning, no error, no
  // disabled Save button. This test pins that gap.
  it("lets total hires exceed 50 via the UI with no validation feedback at all", async () => {
    const user = userEvent.setup();
    render(<DecisionForm industry="Manufacturing" strategy="Cost Leadership" hideRunButton />);
    await screen.findByRole("heading", { level: 1, name: "Recruitment & Selection" });

    const hiringCard = screen.getByText("1. Hiring Needs").closest("section")!;
    const plusButtons = within(hiringCard)
      .getAllByRole("button")
      .filter((b) => b.textContent === "+");

    // Push every role group to its 20-count cap (5 roles x 20 = 100 > 50).
    for (const btn of plusButtons) {
      for (let i = 0; i < 20; i++) {
        await user.click(btn);
      }
    }

    expect(screen.getByText("Total New Hires").parentElement).toHaveTextContent("100");
    expect(
      screen.queryByText(/must be between 0 and 50/)
    ).not.toBeInTheDocument();
  });

  // NOTE: a11y gap — the Diversity Sourcing Goal, Training Coverage, and
  // Benefits % range inputs (DecisionForm.tsx ~L865-888, ~L1280-1303,
  // ~L1750-1773) render their numeric readout in a sibling <span>, not a
  // <label>, and carry no aria-label/aria-labelledby. A screen reader user
  // tabbing to the slider hears no name for it at all. Pinned here via a
  // failed accessible-name lookup rather than getByLabelText succeeding.
  it("documents that the Diversity Sourcing Goal slider has no accessible name", async () => {
    render(<DecisionForm industry="Manufacturing" strategy="Cost Leadership" hideRunButton />);
    await screen.findByRole("heading", { level: 1, name: "Recruitment & Selection" });

    expect(() => screen.getByLabelText(/diversity sourcing goal/i)).toThrow();
    // The slider exists and is reachable by role, just unnamed.
    const diversitySection = screen
      .getByText("3. Diversity Sourcing Goal")
      .closest("section")!;
    const slider = within(diversitySection).getByRole("slider");
    expect(slider).toHaveAccessibleName("");
  });
});
