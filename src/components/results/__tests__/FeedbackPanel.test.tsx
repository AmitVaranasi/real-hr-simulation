import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FeedbackPanel } from "../FeedbackPanel";
import type { FeedbackPayload } from "@/lib/engine/types";

const basePayload: FeedbackPayload = {
  metrics: [
    {
      metric_name: "cost_per_hire",
      display_name: "Cost per hire",
      value: 4500,
      formatted_value: "$4,500",
      benchmark_excellent: 3000,
      benchmark_moderate: 5000,
      benchmark_poor: 7000,
      status: "moderate",
      feedback_text: "Within an acceptable range.",
      perspective: "financial",
    },
  ],
  perspectives: [
    {
      perspective: "financial",
      display_name: "Financial",
      score: 24,
      max_score: 30,
      summary: "Solid financial performance.",
      top_strength: "Revenue growth",
      top_weakness: "Rising operating costs",
    },
  ],
};

describe("FeedbackPanel", () => {
  it("renders the round summary section only when round_summary is present", () => {
    const { rerender } = render(
      <FeedbackPanel feedback={{ ...basePayload, round_summary: "Great round overall." }} />
    );
    expect(screen.getByText("Round summary")).toBeInTheDocument();
    expect(screen.getByText("Great round overall.")).toBeInTheDocument();

    rerender(<FeedbackPanel feedback={{ ...basePayload, round_summary: undefined }} />);
    expect(screen.queryByText("Round summary")).not.toBeInTheDocument();
  });

  it("renders each perspective's score, strength and weakness", () => {
    render(<FeedbackPanel feedback={basePayload} />);
    expect(screen.getByText("Financial")).toBeInTheDocument();
    expect(screen.getByText("24.0 / 30")).toBeInTheDocument();
    expect(screen.getByText("Solid financial performance.")).toBeInTheDocument();
    expect(screen.getByText("Revenue growth")).toBeInTheDocument();
    expect(screen.getByText("Rising operating costs")).toBeInTheDocument();
  });

  it("renders each metric's display name, formatted value, and feedback text", () => {
    render(<FeedbackPanel feedback={basePayload} />);
    expect(screen.getByText("Cost per hire")).toBeInTheDocument();
    expect(screen.getByText("($4,500)")).toBeInTheDocument();
    expect(screen.getByText("Within an acceptable range.")).toBeInTheDocument();
  });

  it("renders nothing for perspectives or metrics sections when arrays are empty", () => {
    render(<FeedbackPanel feedback={{ metrics: [], perspectives: [] }} />);
    expect(screen.getByText("Perspective summaries")).toBeInTheDocument();
    expect(screen.getByText("Metric feedback")).toBeInTheDocument();
    expect(screen.queryByText("Financial")).not.toBeInTheDocument();
  });
});
