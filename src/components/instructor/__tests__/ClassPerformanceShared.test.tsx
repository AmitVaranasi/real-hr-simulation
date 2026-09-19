import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  AreaSpendBar,
  DeltaPill,
  FilterCard,
  KpiBoard,
  RankBadge,
  ScoreBar,
  ViewByToggle,
  compactUsd,
  spendAxisMax,
} from "../ClassPerformanceShared";

describe("FilterCard", () => {
  it("associates the select with its label and reports changes through onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <FilterCard label="Round" value="1" onChange={onChange}>
        <option value="1">Round 1</option>
        <option value="2">Round 2</option>
      </FilterCard>
    );
    const select = screen.getByRole("combobox", { name: "Round" });
    await user.selectOptions(select, "2");
    expect(onChange).toHaveBeenCalledWith("2");
  });

  it("in field variant also exposes an accessible name derived from the label", () => {
    render(
      <FilterCard label="Industry" value="all" onChange={vi.fn()} variant="field">
        <option value="all">All</option>
      </FilterCard>
    );
    expect(
      screen.getByRole("combobox", { name: "Industry" })
    ).toBeInTheDocument();
  });
});

describe("KpiBoard", () => {
  it("renders one tile per entry with its label, value, and optional hint", () => {
    render(
      <KpiBoard
        tiles={[
          { label: "Avg Score", value: "82.4", hint: "+3.1 vs last round", icon: <span />, iconWrap: "bg-blue-50" },
          { label: "Teams", value: "8", icon: <span />, iconWrap: "bg-blue-50" },
        ]}
      />
    );
    expect(screen.getByText("Avg Score")).toBeInTheDocument();
    expect(screen.getByText("82.4")).toBeInTheDocument();
    expect(screen.getByText("+3.1 vs last round")).toBeInTheDocument();
    expect(screen.getByText("Teams")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
  });
});

describe("ViewByToggle", () => {
  it("marks the active option and fires onChange with the clicked option's id", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ViewByToggle
        value="team"
        onChange={onChange}
        options={[
          { id: "team", label: "By Team" },
          { id: "industry", label: "By Industry" },
        ]}
      />
    );
    const active = screen.getByRole("button", { name: "By Team" });
    const inactive = screen.getByRole("button", { name: "By Industry" });
    expect(active.className).toContain("bg-[var(--portal-accent-blue)]");
    expect(inactive.className).not.toContain("bg-[var(--portal-accent-blue)]");

    await user.click(inactive);
    expect(onChange).toHaveBeenCalledWith("industry");
  });
});

describe("RankBadge", () => {
  it("shows a dash for a null rank instead of a badge", () => {
    render(<RankBadge rank={null} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("shows the numeric rank for a real value", () => {
    render(<RankBadge rank={2} />);
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});

describe("ScoreBar", () => {
  it("renders a dash when the score is null", () => {
    render(<ScoreBar value={null} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("formats the score to one decimal and clamps the fill bar width to [0, 100]", () => {
    const { container } = render(<ScoreBar value={140} />);
    expect(screen.getByText("140.0")).toBeInTheDocument();
    const fill = container.querySelector("span > span") as HTMLElement;
    expect(fill.style.width).toBe("100%");
  });
});

describe("DeltaPill", () => {
  it("renders a dash for a null delta", () => {
    render(<DeltaPill value={null} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("prefixes a positive delta with + and uses the positive tone", () => {
    render(<DeltaPill value={4.5} />);
    const pill = screen.getByText("+4.5");
    expect(pill.className).toContain("emerald");
  });

  it("does not prefix a negative delta and uses the negative tone", () => {
    render(<DeltaPill value={-2.25} />);
    const pill = screen.getByText("-2.3");
    expect(pill.className).toContain("rose");
  });
});

describe("AreaSpendBar", () => {
  it("shows a dash for a null value and 0-width fill instead of crashing on a null max ratio", () => {
    const { container } = render(
      <AreaSpendBar label="Recruitment" value={null} max={100_000} share={null} />
    );
    const dashes = within(container).getAllByText("—");
    expect(dashes).toHaveLength(2);
    const fill = container.querySelector("span > span") as HTMLElement;
    expect(fill.style.width).toBe("0%");
  });

  it("renders compacted currency and rounded share for a real value", () => {
    render(
      <AreaSpendBar label="Recruitment" value={50_000} max={100_000} share={33.6} />
    );
    expect(screen.getByText("$50K")).toBeInTheDocument();
    expect(screen.getByText("34%")).toBeInTheDocument();
  });
});

describe("spendAxisMax", () => {
  it("ignores null/undefined entries and rounds up to the next 25k step", () => {
    expect(spendAxisMax([12_000, null, 161_000, undefined])).toBe(175_000);
  });

  it("never returns below the 100k floor even for small spends", () => {
    expect(spendAxisMax([1_000, 2_000])).toBe(100_000);
  });
});

describe("compactUsd", () => {
  it("formats millions, thousands, and small values distinctly", () => {
    expect(compactUsd(2_500_000)).toBe("$2.5M");
    expect(compactUsd(4_200)).toBe("$4K");
    expect(compactUsd(85)).toBe("$85");
  });
});
