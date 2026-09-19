import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TrendChart } from "../TrendChart";

// Recharts needs a real layout width to render its SVG in jsdom (ResponsiveContainer
// measures 0x0 there), so rather than mock it out we assert on the chrome
// TrendChart itself controls: the section heading and the length-gating
// behaviour, which are the only parts of this component with real branching.
//
// NOTE: a11y gap — TrendChart renders a chart with no text alternative (no
// aria-label/role="img" description) and no accompanying data table, so a
// screen-reader user gets nothing when it does render. Reported in the task
// summary, not fixed here.

const point = (round: string) => ({
  round,
  total: 80,
  financial: 20,
  employee: 25,
  process: 15,
  learning: 20,
});

describe("TrendChart", () => {
  it("renders nothing at all for zero data points", () => {
    const { container } = render(<TrendChart data={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for a single data point (a trend needs at least two)", () => {
    const { container } = render(<TrendChart data={[point("Round 1")]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the score trends section once at least two data points are supplied", () => {
    render(<TrendChart data={[point("Round 1"), point("Round 2")]} />);
    expect(screen.getByText("Score trends")).toBeInTheDocument();
  });
});
