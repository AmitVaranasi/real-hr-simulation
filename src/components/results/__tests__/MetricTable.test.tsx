import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MetricTable, OutcomeMetricTable } from "../MetricTable";
import type { MetricFeedback } from "@/lib/engine/types";

const metrics: MetricFeedback[] = [
  {
    metric_name: "cost_per_hire",
    display_name: "Cost per hire",
    value: 4500,
    formatted_value: "$4,500",
    benchmark_excellent: 3000,
    benchmark_moderate: 5000,
    benchmark_poor: 7000,
    status: "excellent",
    feedback_text: "Great job.",
    perspective: "financial",
  },
  {
    metric_name: "turnover_rate",
    display_name: "Turnover rate",
    value: 22,
    formatted_value: "22%",
    benchmark_excellent: 8,
    benchmark_moderate: 15,
    benchmark_poor: 25,
    status: "critical",
    feedback_text: "Needs attention.",
    perspective: "employee",
  },
];

describe("MetricTable — accessibility: real table semantics", () => {
  it("renders a real table with column headers rather than a div grid", () => {
    render(<MetricTable metrics={metrics} />);
    const table = screen.getByRole("table");
    expect(
      within(table).getByRole("columnheader", { name: "Metric" })
    ).toBeInTheDocument();
    expect(
      within(table).getByRole("columnheader", { name: "Status" })
    ).toBeInTheDocument();
    // One data row per metric.
    expect(within(table).getAllByRole("row")).toHaveLength(metrics.length + 1); // +1 header row
  });

  it("renders each metric's display name, value and benchmark figures in its row", () => {
    render(<MetricTable metrics={metrics} />);
    const row = screen.getByRole("row", { name: /Cost per hire/ });
    expect(within(row).getByText("$4,500")).toBeInTheDocument();
    expect(within(row).getByText(/Excellent: 3000/)).toBeInTheDocument();
    expect(within(row).getByText(/Poor: 7000/)).toBeInTheDocument();
  });

  it("shows a status badge whose text matches the metric's status", () => {
    render(<MetricTable metrics={metrics} />);
    const criticalRow = screen.getByRole("row", { name: /Turnover rate/ });
    expect(within(criticalRow).getByText("critical")).toBeInTheDocument();
  });

  it("renders only the header row when given no metrics", () => {
    render(<MetricTable metrics={[]} />);
    expect(screen.getAllByRole("row")).toHaveLength(1);
  });
});

describe("OutcomeMetricTable — grouping and value formatting", () => {
  it("only renders categories that have at least one present metric", () => {
    render(<OutcomeMetricTable outcome={{ cost_per_hire: 5000 }} />);
    expect(screen.getByText("Talent Acquisition")).toBeInTheDocument();
    expect(screen.queryByText("Workforce Inclusion")).not.toBeInTheDocument();
  });

  it("renders nothing (no categories) when the outcome has no recognized keys", () => {
    render(<OutcomeMetricTable outcome={{ unrelated_key: 1 }} />);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("formats a dollar-suffixed metric with a leading $ and thousands separators", () => {
    render(<OutcomeMetricTable outcome={{ cost_per_hire: 12345 }} />);
    expect(screen.getByText("$12,345")).toBeInTheDocument();
  });

  it("formats a /100-suffixed metric to one decimal place with the /100 suffix", () => {
    render(<OutcomeMetricTable outcome={{ hiring_quality: 87.456 }} />);
    expect(screen.getByText("87.5/100")).toBeInTheDocument();
  });

  it("formats the productivity index as a percentage of its 0-1 fraction", () => {
    render(<OutcomeMetricTable outcome={{ productivity: 0.834 }} />);
    expect(screen.getByText("83.4%")).toBeInTheDocument();
  });

  it("shows a dash for a metric value that is null or not a number", () => {
    render(<OutcomeMetricTable outcome={{ cost_per_hire: null }} />);
    // null is filtered out by `!= null`, so cost_per_hire's row is entirely
    // absent rather than showing a dash — this pins that behavior.
    expect(screen.queryByText("Cost per hire")).not.toBeInTheDocument();
  });

  it("renders a plain two-decimal value for a metric with no suffix", () => {
    render(<OutcomeMetricTable outcome={{ time_to_fill: 30 }} />);
    expect(screen.getByText("30.00")).toBeInTheDocument();
  });
});
