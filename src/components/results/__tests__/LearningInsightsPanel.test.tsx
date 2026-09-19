import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LearningInsightsPanel } from "../LearningInsightsPanel";

describe("LearningInsightsPanel", () => {
  it("renders items under their matching section headings", () => {
    render(
      <LearningInsightsPanel
        insights={{
          went_well: ["Strong onboarding pipeline"],
          hurt_performance: ["Underinvested in training"],
          next_round: ["Increase training budget"],
          causal_factors: [],
        }}
      />
    );
    expect(screen.getByText("What went well")).toBeInTheDocument();
    expect(screen.getByText("Strong onboarding pipeline")).toBeInTheDocument();
    expect(screen.getByText("What hurt performance")).toBeInTheDocument();
    expect(screen.getByText("Underinvested in training")).toBeInTheDocument();
    expect(screen.getByText("Next round")).toBeInTheDocument();
    expect(screen.getByText("Increase training budget")).toBeInTheDocument();
  });

  it("hides the causal factors section when the array is empty", () => {
    render(
      <LearningInsightsPanel
        insights={{
          went_well: [],
          hurt_performance: [],
          next_round: [],
          causal_factors: [],
        }}
      />
    );
    expect(
      screen.queryByText("Why these outcomes happened")
    ).not.toBeInTheDocument();
  });

  it("shows the causal factors section with an arrow prefix per item when populated", () => {
    render(
      <LearningInsightsPanel
        insights={{
          went_well: [],
          hurt_performance: [],
          next_round: [],
          causal_factors: ["High turnover drove up recruitment spend"],
        }}
      />
    );
    expect(screen.getByText("Why these outcomes happened")).toBeInTheDocument();
    expect(
      screen.getByText("→ High turnover drove up recruitment spend")
    ).toBeInTheDocument();
  });
});
