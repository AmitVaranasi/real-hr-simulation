import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConflictResolutionDialog } from "../ConflictResolutionDialog";
import { createDefaultDecision } from "@/lib/engine/defaults";

const base = createDefaultDecision();

describe("ConflictResolutionDialog", () => {
  it("auto-merges and skips per-field choices when nothing conflicts", async () => {
    const user = userEvent.setup();
    const mine = { ...base, diversity_goal_pct: 40 }; // my exclusive edit
    const theirs = { ...base, onboarding_investment: 999 }; // their exclusive edit
    const onResolve = vi.fn();

    render(
      <ConflictResolutionDialog
        base={base}
        mine={mine}
        theirs={theirs}
        serverVersion={2}
        onResolve={onResolve}
        onCancel={vi.fn()}
      />
    );

    expect(
      screen.getByText(/can be merged automatically/i)
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /merge & save/i }));

    expect(onResolve).toHaveBeenCalledTimes(1);
    const [merged, version] = onResolve.mock.calls[0];
    expect(merged.diversity_goal_pct).toBe(40); // kept my edit
    expect(merged.onboarding_investment).toBe(999); // took their edit
    expect(version).toBe(2);
  });

  it("surfaces a per-field choice for a true conflict and defaults to the teammate's value", async () => {
    const user = userEvent.setup();
    const mine = { ...base, diversity_goal_pct: 40 };
    const theirs = { ...base, diversity_goal_pct: 25 };
    const onResolve = vi.fn();

    render(
      <ConflictResolutionDialog
        base={base}
        mine={mine}
        theirs={theirs}
        serverVersion={5}
        onResolve={onResolve}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText("Diversity Goal Pct")).toBeInTheDocument();

    // Defaults to "theirs" (the teammate's value) unless the student opts in.
    await user.click(screen.getByRole("button", { name: /resolve & save/i }));
    expect(onResolve).toHaveBeenCalledTimes(1);
    expect(onResolve.mock.calls[0][0].diversity_goal_pct).toBe(25);
    expect(onResolve.mock.calls[0][1]).toBe(5);
  });

  it("lets the student pick 'mine' for a conflicting field", async () => {
    const user = userEvent.setup();
    const mine = { ...base, diversity_goal_pct: 40 };
    const theirs = { ...base, diversity_goal_pct: 25 };
    const onResolve = vi.fn();

    render(
      <ConflictResolutionDialog
        base={base}
        mine={mine}
        theirs={theirs}
        serverVersion={5}
        onResolve={onResolve}
        onCancel={vi.fn()}
      />
    );

    await user.click(screen.getByRole("radio", { name: /keep mine/i }));
    await user.click(screen.getByRole("button", { name: /resolve & save/i }));
    expect(onResolve.mock.calls[0][0].diversity_goal_pct).toBe(40);
  });

  it("calls onCancel without resolving", async () => {
    const user = userEvent.setup();
    const mine = { ...base, diversity_goal_pct: 40 };
    const theirs = { ...base, diversity_goal_pct: 25 };
    const onCancel = vi.fn();
    const onResolve = vi.fn();

    render(
      <ConflictResolutionDialog
        base={base}
        mine={mine}
        theirs={theirs}
        serverVersion={5}
        onResolve={onResolve}
        onCancel={onCancel}
      />
    );

    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onResolve).not.toHaveBeenCalled();
  });
});
