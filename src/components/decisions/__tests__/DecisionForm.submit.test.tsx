import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DecisionForm } from "../DecisionForm";
import { createDefaultDecision } from "@/lib/engine/defaults";

// "Round closed" / "already submitted" gating is NOT implemented inside
// DecisionForm at all: `roundOpen` only changes the OPEN badge text in
// DecisionStatusStrip (DecisionChrome.tsx), and DecisionForm never reads it
// to disable any input or button. The actual gate lives one level up in
// DecisionWorkspace.tsx (`if (!roundOpen) return <p>...not open...</p>` and
// the analogous `submitted` branch) which is a *different* component in
// this same directory. So DecisionForm's own save/submit surface is just
// the sticky footer — that's what these tests exercise.

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

describe("DecisionForm save / continue footer", () => {
  it("does not render a sticky footer when neither onSaveNow nor onSaveAndContinue is provided", async () => {
    render(<DecisionForm industry="Manufacturing" strategy="Cost Leadership" hideRunButton />);
    await screen.findByRole("heading", { level: 1, name: "Recruitment & Selection" });
    expect(screen.queryByRole("button", { name: /save now/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /save & continue/i })
    ).not.toBeInTheDocument();
  });

  it("calls onSaveNow when Save Now is clicked", async () => {
    const user = userEvent.setup();
    const onSaveNow = vi.fn();
    render(
      <DecisionForm
        industry="Manufacturing"
        strategy="Cost Leadership"
        hideRunButton
        onSaveNow={onSaveNow}
      />
    );
    await screen.findByRole("heading", { level: 1, name: "Recruitment & Selection" });
    await user.click(screen.getByRole("button", { name: "Save Now" }));
    expect(onSaveNow).toHaveBeenCalledTimes(1);
  });

  it("labels Save & Continue with the next module, and with Review & Submit on the last tab", async () => {
    render(
      <DecisionForm
        industry="Manufacturing"
        strategy="Cost Leadership"
        hideRunButton
        onSaveAndContinue={() => {}}
      />
    );
    await screen.findByRole("heading", { level: 1, name: "Recruitment & Selection" });
    expect(
      screen.getByRole("button", {
        name: "Save & Continue → Performance Management",
      })
    ).toBeInTheDocument();

    mockSearchParams = new URLSearchParams({ tab: "dei" });
    const { unmount } = render(
      <DecisionForm
        industry="Manufacturing"
        strategy="Cost Leadership"
        hideRunButton
        onSaveAndContinue={() => {}}
      />
    );
    await screen.findByRole("heading", { level: 1, name: "DEI Initiatives" });
    expect(
      screen.getByRole("button", { name: "Save & Continue → Review & Submit" })
    ).toBeInTheDocument();
    unmount();
  });

  // NOTE: real defect — DecisionStickyFooter (DecisionChrome.tsx L121-147)
  // never passes `disabled={saving}` to either button, it only swaps the
  // "All changes auto-saved" text to "Saving…". A student double-clicking
  // Save & Continue while a save is already in flight fires onSaveAndContinue
  // twice with no guard in this component.
  it("does not disable Save Now while saving=true (pins the missing double-submit guard)", async () => {
    const user = userEvent.setup();
    const onSaveNow = vi.fn();
    render(
      <DecisionForm
        industry="Manufacturing"
        strategy="Cost Leadership"
        hideRunButton
        saving
        onSaveNow={onSaveNow}
      />
    );
    await screen.findByRole("heading", { level: 1, name: "Recruitment & Selection" });
    const button = screen.getByRole("button", { name: "Save Now" });
    expect(button).not.toBeDisabled();
    await user.click(button);
    expect(onSaveNow).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Saving…")).toBeInTheDocument();
  });

  it("shows Run simulation / Reset defaults instead of a save footer when hideRunButton is false", async () => {
    render(<DecisionForm industry="Manufacturing" strategy="Cost Leadership" />);
    await screen.findByRole("heading", { level: 1, name: "Recruitment & Selection" });
    expect(screen.getByRole("button", { name: "Run simulation" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset defaults" })).toBeInTheDocument();
  });

  it("Reset defaults restores a modified decision back to createDefaultDecision()", async () => {
    const user = userEvent.setup();
    const onDecisionChange = vi.fn();
    const modified = createDefaultDecision({ onboarding_investment: 9999 });
    render(
      <DecisionForm
        industry="Manufacturing"
        strategy="Cost Leadership"
        controlledDecision={modified}
        onDecisionChange={onDecisionChange}
      />
    );
    await screen.findByRole("heading", { level: 1, name: "Recruitment & Selection" });
    await user.click(screen.getByRole("button", { name: "Reset defaults" }));
    expect(onDecisionChange).toHaveBeenCalledWith(createDefaultDecision());
  });
});
