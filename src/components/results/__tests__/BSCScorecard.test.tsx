import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BSCScorecard } from "../BSCScorecard";
import type { BSCScores } from "@/lib/engine/types";

const baseScores: BSCScores = {
  score_financial: 24,
  score_employee: 30,
  score_process: 21,
  score_learning: 28,
  total_score: 103,
  strategy_bonus: 0,
  industry_penalty: 0,
};

describe("BSCScorecard", () => {
  it("renders the total score and all four perspective labels", () => {
    render(<BSCScorecard scores={baseScores} />);
    expect(screen.getByText("103.0")).toBeInTheDocument();
    for (const label of [
      "Financial",
      "Employee",
      "Internal Process",
      "Learning & Growth",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("shows each perspective's score against its weight using default weights", () => {
    render(<BSCScorecard scores={baseScores} />);
    // Default weights: financial 30, employee 35, process 30, learning 35.
    expect(screen.getByText("24.0 / 30")).toBeInTheDocument();
    expect(screen.getByText("30.0 / 35")).toBeInTheDocument();
    expect(screen.getByText("21.0 / 30")).toBeInTheDocument();
    expect(screen.getByText("28.0 / 35")).toBeInTheDocument();
  });

  it("uses custom bscWeights instead of the defaults when supplied", () => {
    render(
      <BSCScorecard
        scores={baseScores}
        bscWeights={{ financial: 50, employee: 20, process: 15, learning: 15 }}
      />
    );
    expect(screen.getByText("24.0 / 50")).toBeInTheDocument();
    expect(screen.getByText("30.0 / 20")).toBeInTheDocument();
  });

  it("only shows the strategy bonus line when it is greater than zero", () => {
    const { rerender } = render(
      <BSCScorecard scores={{ ...baseScores, strategy_bonus: 5 }} />
    );
    expect(screen.getByText("Strategy bonus: +5")).toBeInTheDocument();

    rerender(<BSCScorecard scores={{ ...baseScores, strategy_bonus: 0 }} />);
    expect(screen.queryByText(/Strategy bonus/)).not.toBeInTheDocument();
  });

  it("only shows the industry penalty line when it is greater than zero", () => {
    const { rerender } = render(
      <BSCScorecard scores={{ ...baseScores, industry_penalty: 8 }} />
    );
    expect(screen.getByText("Industry penalty: -8")).toBeInTheDocument();

    rerender(<BSCScorecard scores={{ ...baseScores, industry_penalty: 0 }} />);
    expect(screen.queryByText(/Industry penalty/)).not.toBeInTheDocument();
  });

  it("caps the progress bar width at 100% even when a score exceeds its max", () => {
    const overScores: BSCScores = { ...baseScores, score_financial: 60 };
    const { container } = render(<BSCScorecard scores={overScores} />);
    // score_financial (60) / weight (30) would be 200%, but the bar fill
    // must be capped visually so it doesn't overflow its track.
    const fill = container.querySelector<HTMLElement>('[style*="width"]');
    expect(fill).toBeTruthy();
    expect(fill!.style.width).toBe("100%");
  });

  it("treats a zero-weight perspective as 0% filled instead of dividing by zero", () => {
    const { container } = render(
      <BSCScorecard
        scores={baseScores}
        bscWeights={{ financial: 0, employee: 35, process: 30, learning: 35 }}
      />
    );
    expect(screen.getByText("24.0 / 0")).toBeInTheDocument();
    const bars = container.querySelectorAll<HTMLElement>('[style*="width"]');
    // The financial card's bar should be the 0%-width one; none should be NaN%.
    const widths = Array.from(bars).map((b) => b.style.width);
    expect(widths).toContain("0%");
    expect(widths.some((w) => w.includes("NaN"))).toBe(false);
  });
});
