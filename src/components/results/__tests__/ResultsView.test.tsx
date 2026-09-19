import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ResultsView } from "../ResultsView";
import { getStrategyConfig } from "@/lib/engine/config";

// ResultsView's only job is to reshape `outcome` + `team` into
// WorkforceBriefData and hand it to WorkforceBriefClient. WorkforceBriefClient
// itself pulls in WorkforceBriefView (tested separately) and jspdf via
// lib/export/pdf, so it's mocked here to a prop-capturing stub — this keeps
// the test focused on ResultsView's data mapping instead of re-testing the
// 850-line view or pulling in the PDF library.
vi.mock("@/components/results/WorkforceBriefClient", () => ({
  WorkforceBriefClient: (props: { data: Record<string, unknown> }) => (
    <div data-testid="captured-data">{JSON.stringify(props.data)}</div>
  ),
}));

function capturedData() {
  const el = screen.getByTestId("captured-data");
  return JSON.parse(el.textContent ?? "{}");
}

const team = { name: "Team A", industry: "Retail", strategy: "Differentiation" };

describe("ResultsView", () => {
  it("maps outcome fields into WorkforceBriefData with the right key names", () => {
    render(
      <ResultsView
        teamId="t1"
        roundId="r1"
        roundNumber={2}
        sessionName="Session 1"
        team={team}
        outcome={{
          total_score: 87.5,
          score_financial: 20,
          revenue: 5_000_000,
          headcount: 100,
          total_compensation: 1_000_000,
        }}
      />
    );
    const data = capturedData();
    expect(data.totalScore).toBe(87.5);
    expect(data.scoreFinancial).toBe(20);
    expect(data.revenue).toBe(5_000_000);
    expect(data.roundNumber).toBe(2);
    expect(data.industry).toBe("Retail");
  });

  it("prefers instructor_override over total_score when both are present", () => {
    render(
      <ResultsView
        teamId="t1"
        roundId="r1"
        roundNumber={1}
        sessionName="Session 1"
        team={team}
        outcome={{ total_score: 50, instructor_override: 99 }}
      />
    );
    expect(capturedData().totalScore).toBe(99);
  });

  it("falls back to total_score when instructor_override is absent", () => {
    render(
      <ResultsView
        teamId="t1"
        roundId="r1"
        roundNumber={1}
        sessionName="Session 1"
        team={team}
        outcome={{ total_score: 50 }}
      />
    );
    expect(capturedData().totalScore).toBe(50);
  });

  it("defaults every score/metric field to 0 when the outcome object is empty", () => {
    render(
      <ResultsView
        teamId="t1"
        roundId="r1"
        roundNumber={1}
        sessionName="Session 1"
        team={team}
        outcome={{}}
      />
    );
    const data = capturedData();
    expect(data.totalScore).toBe(0);
    expect(data.revenue).toBe(0);
    expect(data.averageSalary).toBe(0);
  });

  it("computes averageSalary as total_compensation divided by headcount", () => {
    render(
      <ResultsView
        teamId="t1"
        roundId="r1"
        roundNumber={1}
        sessionName="Session 1"
        team={team}
        outcome={{ total_compensation: 4_000_000, headcount: 200 }}
      />
    );
    expect(capturedData().averageSalary).toBe(20_000);
  });

  it("looks up BSC max weights from the team's strategy config, not a fixed constant", () => {
    render(
      <ResultsView
        teamId="t1"
        roundId="r1"
        roundNumber={1}
        sessionName="Session 1"
        team={team}
        outcome={{}}
      />
    );
    const expected = getStrategyConfig("Differentiation").bsc_weights;
    const data = capturedData();
    expect(data.maxFinancial).toBe(expected.financial);
    expect(data.maxEmployee).toBe(expected.employee);
    expect(data.maxProcess).toBe(expected.process);
    expect(data.maxLearning).toBe(expected.learning);
  });

  it("uses a different strategy's weights when the team's strategy differs", () => {
    render(
      <ResultsView
        teamId="t1"
        roundId="r1"
        roundNumber={1}
        sessionName="Session 1"
        team={{ ...team, strategy: "Cost Leadership" }}
        outcome={{}}
      />
    );
    const expected = getStrategyConfig("Cost Leadership").bsc_weights;
    expect(capturedData().maxFinancial).toBe(expected.financial);
  });

  it("passes reflection content through, and null when no reflection exists", () => {
    const { rerender } = render(
      <ResultsView
        teamId="t1"
        roundId="r1"
        roundNumber={1}
        sessionName="Session 1"
        team={team}
        outcome={{}}
        reflection={{ content: "Great round", submitted_at: "2026-01-01" }}
      />
    );
    expect(capturedData().reflectionContent).toBe("Great round");

    rerender(
      <ResultsView
        teamId="t1"
        roundId="r1"
        roundNumber={1}
        sessionName="Session 1"
        team={team}
        outcome={{}}
      />
    );
    expect(capturedData().reflectionContent).toBeNull();
  });
});
