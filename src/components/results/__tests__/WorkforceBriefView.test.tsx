import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  WorkforceBriefView,
  type RoundListItem,
  type WorkforceBriefData,
} from "../WorkforceBriefView";

function round(n: number, over: Partial<RoundListItem> = {}): RoundListItem {
  return {
    id: String(n),
    roundId: `r${n}`,
    roundNumber: n,
    dateLabel: `Jan ${n}, 2026`,
    href: `/results?round=r${n}`,
    ...over,
  };
}

describe("WorkforceBriefView — round sidebar: placeholder vs real", () => {
  it("renders five dashed placeholders when no rounds are supplied", () => {
    render(<WorkforceBriefView data={{ rounds: [], roundNumber: 1 }} />);
    expect(screen.queryAllByRole("link", { name: /Round \d Results/ })).toHaveLength(0);
    expect(screen.getAllByText("—")).toHaveLength(5);
  });

  it("renders computed rounds as links and pads the rest with placeholders", () => {
    render(
      <WorkforceBriefView data={{ rounds: [round(1), round(2)], roundNumber: 2 }} />
    );
    const link1 = screen.getByRole("link", { name: /Round 1 Results/ });
    const link2 = screen.getByRole("link", { name: /Round 2 Results/ });
    expect(link1).toHaveAttribute("href", "/results?round=r1");
    expect(link2).toHaveAttribute("href", "/results?round=r2");
    // Boundary: round 3 has not been computed, so it's a placeholder, not a link.
    expect(screen.queryByRole("link", { name: /Round 3 Results/ })).not.toBeInTheDocument();
    expect(screen.getAllByText("—")).toHaveLength(3);
  });

  it("marks the current roundNumber active even without an explicit selectedRoundId", () => {
    render(
      <WorkforceBriefView data={{ rounds: [round(1), round(2)], roundNumber: 2 }} />
    );
    const link2 = screen.getByRole("link", { name: /Round 2 Results/ });
    expect(within(link2).getByText("Round 2 Results").className).toContain(
      "text-[var(--portal-primary)]"
    );
  });
});

describe("WorkforceBriefView — BSC scorecard", () => {
  it("shows the overall total score as a percentage and each perspective's score/max", () => {
    render(
      <WorkforceBriefView
        data={{
          totalScore: 76.4,
          scoreFinancial: 15,
          maxFinancial: 20,
          scoreEmployee: 22,
          maxEmployee: 30,
          rounds: [],
        }}
      />
    );
    expect(screen.getByText("76.4%")).toBeInTheDocument();
    // Both the ProgressBar and the perspective summary card render the same
    // "score / max" string, so it legitimately appears twice.
    expect(screen.getAllByText("15.0 / 20").length).toBe(2);
    expect(screen.getAllByText("22.0 / 30").length).toBe(2);
  });

  it("caps a perspective's progress bar fill at 100% when score exceeds max", () => {
    const { container } = render(
      <WorkforceBriefView
        data={{ scoreFinancial: 999, maxFinancial: 20, rounds: [] }}
      />
    );
    const fills = Array.from(
      container.querySelectorAll<HTMLElement>('[style*="width"]')
    );
    expect(fills.some((el) => el.style.width === "100%")).toBe(true);
  });
});

describe("WorkforceBriefView — currency/percent formatting", () => {
  it("formats a negative profit with a leading minus sign and marks it red", () => {
    render(<WorkforceBriefView data={{ profit: -1_500_000, rounds: [] }} />);
    const value = screen.getByText("-$1,500,000");
    expect(value.className).toContain("text-red-600");
  });

  it("formats market share and profit margin as percentages with one decimal", () => {
    render(
      <WorkforceBriefView
        data={{ marketShare: 18.25, profitMargin: -4.5, rounds: [] }}
      />
    );
    expect(screen.getByText("18.3%")).toBeInTheDocument();
    expect(screen.getByText("-4.5%")).toBeInTheDocument();
  });

  it("renders headcount as a plain, unformatted integer string", () => {
    render(<WorkforceBriefView data={{ headcount: 281, rounds: [] }} />);
    expect(screen.getByText("281")).toBeInTheDocument();
  });
});

describe("WorkforceBriefView — feedback metric tone thresholds", () => {
  it("colors turnover feedback red (critical) once above 15%", () => {
    render(<WorkforceBriefView data={{ turnoverRate: 16, rounds: [] }} />);
    const label = screen.getByText("Turnover Rate");
    expect(label.className).toContain("text-red-600");
  });

  it("colors turnover feedback green (excellent) at or below 10%", () => {
    render(<WorkforceBriefView data={{ turnoverRate: 9, rounds: [] }} />);
    const label = screen.getByText("Turnover Rate");
    expect(label.className).toContain("text-emerald-700");
  });

  it("colors turnover feedback at the moderate boundary (>10 and <=15) distinctly from excellent/critical", () => {
    render(<WorkforceBriefView data={{ turnoverRate: 15, rounds: [] }} />);
    const label = screen.getByText("Turnover Rate");
    // moderate uses the brand color, not emerald or red.
    expect(label.className).not.toContain("text-emerald-700");
    expect(label.className).not.toContain("text-red-600");
  });
});

describe("WorkforceBriefView — download PDF wiring", () => {
  it("calls onDownloadPdf when the button is clicked", async () => {
    const onDownloadPdf = vi.fn();
    render(<WorkforceBriefView data={{ rounds: [], onDownloadPdf }} />);
    await userEvent.click(
      screen.getByRole("button", { name: /Download PDF Report/i })
    );
    expect(onDownloadPdf).toHaveBeenCalledTimes(1);
  });

  it("does not throw when clicked without a handler", async () => {
    render(<WorkforceBriefView data={{ rounds: [] }} />);
    await userEvent.click(
      screen.getByRole("button", { name: /Download PDF Report/i })
    );
  });
});

describe("WorkforceBriefView — team reflection form", () => {
  it("disables submit until the reflection reaches 100 characters", async () => {
    const onSaveReflection = vi.fn().mockResolvedValue(undefined);
    render(<WorkforceBriefView data={{ rounds: [], onSaveReflection }} />);
    const textarea = screen.getByPlaceholderText("Our team focused on...");
    const submit = screen.getByRole("button", { name: "Submit Reflection" });
    expect(submit).toBeDisabled();

    await userEvent.type(textarea, "short reflection");
    expect(submit).toBeDisabled();

    await userEvent.type(textarea, "x".repeat(90));
    expect(submit).toBeEnabled();
  });

  it("disables submit entirely when no onSaveReflection handler is provided, even at 100+ chars", async () => {
    render(<WorkforceBriefView data={{ rounds: [] }} />);
    const textarea = screen.getByPlaceholderText("Our team focused on...");
    await userEvent.type(textarea, "x".repeat(120));
    expect(screen.getByRole("button", { name: "Submit Reflection" })).toBeDisabled();
  });

  it("submits the reflection text and shows a success message", async () => {
    const onSaveReflection = vi.fn().mockResolvedValue(undefined);
    render(<WorkforceBriefView data={{ rounds: [], onSaveReflection }} />);
    const textarea = screen.getByPlaceholderText("Our team focused on...");
    const content = "x".repeat(110);
    await userEvent.type(textarea, content);
    await userEvent.click(screen.getByRole("button", { name: "Submit Reflection" }));
    expect(onSaveReflection).toHaveBeenCalledWith(content);
    expect(
      await screen.findByText("Reflection submitted successfully!")
    ).toBeInTheDocument();
  });

  it("shows an error message when onSaveReflection rejects", async () => {
    const onSaveReflection = vi.fn().mockRejectedValue(new Error("boom"));
    render(<WorkforceBriefView data={{ rounds: [], onSaveReflection }} />);
    const textarea = screen.getByPlaceholderText("Our team focused on...");
    await userEvent.type(textarea, "x".repeat(110));
    await userEvent.click(screen.getByRole("button", { name: "Submit Reflection" }));
    expect(await screen.findByText("Error saving reflection.")).toBeInTheDocument();
  });

  it("pre-fills the textarea from reflectionContent and updates the character count live", async () => {
    render(
      <WorkforceBriefView
        data={{ rounds: [], reflectionContent: "Existing reflection text" }}
      />
    );
    const textarea = screen.getByPlaceholderText(
      "Our team focused on..."
    ) as HTMLTextAreaElement;
    expect(textarea.value).toBe("Existing reflection text");
    expect(screen.getByText(/^24 \/ 2000/)).toBeInTheDocument();
  });
});

describe("WorkforceBriefView — default data", () => {
  it("renders sensible content when no data prop is supplied at all", () => {
    render(<WorkforceBriefView />);
    expect(
      screen.getByRole("heading", { name: /The Workforce Brief – Round 1 Results/ })
    ).toBeInTheDocument();
  });

  it("merges a partial data object over the defaults rather than replacing them wholesale", () => {
    const partial: Partial<WorkforceBriefData> = { teamName: "Custom Team", rounds: [] };
    render(<WorkforceBriefView data={partial} />);
    // roundNumber (1) comes from defaults since it wasn't overridden.
    expect(
      screen.getByRole("heading", { name: /Round 1 Results/ })
    ).toBeInTheDocument();
  });
});

describe("WorkforceBriefView — Workforce Performance Metrics tables", () => {
  it("renders each metric group as a real table with a named caption and row headers", () => {
    render(<WorkforceBriefView data={{ rounds: [] }} />);
    const tables = screen.getAllByRole("table");
    // One table per metric group (Talent Acquisition, Workforce & Employee
    // Experience, Learning & Talent Development, Performance Management,
    // Compensation & HR Financials, Workforce Inclusion, HR Technology &
    // Capability).
    expect(tables).toHaveLength(7);

    const talentAcquisition = screen.getByRole("table", {
      name: "Talent Acquisition",
    });
    expect(talentAcquisition).toBeInTheDocument();
    expect(
      within(talentAcquisition).getByRole("rowheader", { name: "Cost per Hire" })
    ).toBeInTheDocument();
    expect(
      within(talentAcquisition).getAllByRole("columnheader")
    ).toHaveLength(2);
  });
});
