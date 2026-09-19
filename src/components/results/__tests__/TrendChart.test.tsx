import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TrendChart } from "../TrendChart";

// Recharts needs a real layout width to render its SVG in jsdom (ResponsiveContainer
// measures 0x0 there), so rather than mock it out we assert on the chrome
// TrendChart itself controls: the section heading, the length-gating
// behaviour, and the accessible name/description/data-table wiring, which
// are the only parts of this component with real branching (the SVG itself
// still won't render meaningfully under jsdom).

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

  it("gives the chart an accessible name and description instead of being silent to screen readers", () => {
    render(<TrendChart data={[point("Round 1"), point("Round 2")]} />);
    const chart = screen.getByRole("img", { name: "Score trends" });
    expect(chart).toHaveAccessibleDescription(/Round 1 to Round 2/);
  });

  it("provides the chart's underlying series as a visually-hidden data table", () => {
    render(<TrendChart data={[point("Round 1"), point("Round 2")]} />);
    const table = screen.getByRole("table", {
      name: /underlying data for the chart above/,
    });
    expect(table.className).toContain("sr-only");
    expect(
      within(table).getAllByRole("columnheader").map((h) => h.textContent)
    ).toEqual([
      "Round",
      "Total",
      "Financial",
      "Employee",
      "Internal Process",
      "Learning & Growth",
    ]);
    expect(
      within(table).getByRole("rowheader", { name: "Round 1" })
    ).toBeInTheDocument();
    expect(
      within(table).getByRole("rowheader", { name: "Round 2" })
    ).toBeInTheDocument();
  });
});
