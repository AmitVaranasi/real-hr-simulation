import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DecisionForm } from "../DecisionForm";
import {
  computeBudgetBreakdown,
  computeRecruitmentCost,
  computeCompensationBudgetSpend,
} from "@/lib/engine/budget";
import { createDefaultDecision } from "@/lib/engine/defaults";
import { getIndustryConfig, priorStateFromIndustry } from "@/lib/engine/config";
import { formatCurrency } from "@/lib/utils";

// The budget tracker and per-module "Decision Impact Preview" cards are
// driven live off computeBudgetBreakdown(decision, ...) via useMemo, keyed
// on `decision`. These tests change real form controls and assert the
// displayed totals match what the engine functions compute directly for the
// resulting decision, so the tests fail if the live wiring breaks even
// though the maths themselves stay correct.

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

const industryConfig = getIndustryConfig("Manufacturing");
const prior = priorStateFromIndustry("Manufacturing");

describe("DecisionForm live budget totals", () => {
  it("shows the discretionary budget total spend for the default decision on mount", async () => {
    render(<DecisionForm industry="Manufacturing" strategy="Cost Leadership" hideRunButton />);
    await screen.findByRole("heading", { level: 1, name: "Recruitment & Selection" });

    const defaultDecision = createDefaultDecision();
    const budget = computeBudgetBreakdown(
      defaultDecision,
      prior.headcount,
      industryConfig.base_market_salary,
      industryConfig
    );

    expect(
      screen.getByText(
        `${formatCurrency(budget.total_spend)} / ${formatCurrency(budget.available_budget)}`
      )
    ).toBeInTheDocument();
  });

  it("updates Total Recruitment Cost live when onboarding investment changes", async () => {
    render(<DecisionForm industry="Manufacturing" strategy="Cost Leadership" hideRunButton />);
    await screen.findByRole("heading", { level: 1, name: "Recruitment & Selection" });

    // Onboarding investment is a nested-label numeric input alongside its
    // own +/- steppers; those steppers share text ("−"/"+") with the role
    // hire-count controls elsewhere on this tab, so we scope to this card's
    // label rather than relying on getByLabelText's computed-name matching.
    const onboardingLabel = screen
      .getByText("Onboarding Investment (per hire)")
      .closest("label")!;
    const input = within(onboardingLabel).getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "2000" } });

    const decision = createDefaultDecision({ onboarding_investment: 2000 });
    const expectedCost = computeRecruitmentCost(decision, industryConfig);

    expect(screen.getAllByText(formatCurrency(expectedCost)).length).toBeGreaterThan(0);
  });

  it("increases the total recruitment cost estimate when a role's hire count is incremented", async () => {
    const user = userEvent.setup();
    render(<DecisionForm industry="Manufacturing" strategy="Cost Leadership" hideRunButton />);
    await screen.findByRole("heading", { level: 1, name: "Recruitment & Selection" });

    const before = createDefaultDecision();
    const beforeCost = computeRecruitmentCost(before, industryConfig);

    // Entry-Level / Support starts at count 2 (see createDefaultDecision).
    const entryRow = screen.getByText("Entry-Level / Support").closest("li")!;
    const incrementBtn = entryRow.querySelector("button:last-of-type") as HTMLButtonElement;
    await user.click(incrementBtn);

    const after = createDefaultDecision({
      positions_to_fill: [
        { role_id: "entry", count: 3 },
        { role_id: "professional", count: 2 },
        { role_id: "technical", count: 1 },
      ],
    });
    const afterCost = computeRecruitmentCost(after, industryConfig);

    expect(afterCost).toBeGreaterThan(beforeCost);
    expect(screen.getAllByText(formatCurrency(afterCost)).length).toBeGreaterThan(0);
    expect(screen.queryAllByText(formatCurrency(beforeCost))).toHaveLength(0);
  });

  it("moves the benefits % slider on the Compensation tab and updates discretionary comp spend", async () => {
    mockSearchParams = new URLSearchParams({ tab: "compensation" });
    render(<DecisionForm industry="Manufacturing" strategy="Cost Leadership" hideRunButton />);
    await screen.findByRole("heading", { level: 1, name: "Compensation & Benefits" });

    const benefitsCard = screen.getByText("2. Benefits Level").closest("section")!;
    const slider = within(benefitsCard).getByRole("slider");
    fireEvent.change(slider, { target: { value: "20" } });

    const decision = createDefaultDecision({ benefits_pct: 20 });
    const expectedSpend = computeCompensationBudgetSpend(
      decision,
      prior.headcount,
      industryConfig.base_market_salary
    );

    // The card also shows the slider's static "20%" max-range label, so
    // scope to the live readout specifically (the bold accent figure).
    const readout = within(benefitsCard).getByText("Benefits %").nextElementSibling;
    expect(readout).toHaveTextContent("20%");
    expect(screen.getAllByText(formatCurrency(expectedSpend)).length).toBeGreaterThan(0);
  });
});
