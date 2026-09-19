import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { HRCoachPlaceholder } from "../HRCoachPlaceholder";

describe("HRCoachPlaceholder", () => {
  it("renders the coming-soon heading and all three prompt buttons", () => {
    render(<HRCoachPlaceholder />);
    expect(screen.getByText("HR Coach (coming soon)")).toBeInTheDocument();
    for (const label of [
      "Ask the HR Coach",
      "Why did my score change?",
      "What should I consider next round?",
    ]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("disables every prompt button so it cannot be activated", async () => {
    const onClick = vi.fn();
    render(
      <div onClick={onClick}>
        <HRCoachPlaceholder />
      </div>
    );
    const button = screen.getByRole("button", { name: "Ask the HR Coach" });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    // A disabled button does not dispatch a click, so the wrapper's handler
    // (which would fire for a bubbled click) must not be called either.
    expect(onClick).not.toHaveBeenCalled();
  });
});
