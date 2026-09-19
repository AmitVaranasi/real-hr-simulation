import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ReportTabsBar, isReportsEnvironment } from "../ReportTabsBar";

let mockPathname = "/reports/workforce-brief";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

describe("isReportsEnvironment", () => {
  it("matches any /reports path", () => {
    expect(isReportsEnvironment("/reports/balance-sheet")).toBe(true);
  });

  it("matches a round results path", () => {
    expect(isReportsEnvironment("/round/abc-123/results")).toBe(true);
  });

  it("does not match unrelated paths", () => {
    expect(isReportsEnvironment("/dashboard")).toBe(false);
  });
});

describe("ReportTabsBar", () => {
  it("renders a labelled navigation landmark with a link for every report tab", () => {
    render(<ReportTabsBar />);
    const nav = screen.getByRole("navigation", { name: "Reports" });
    expect(
      within(nav).getByRole("link", { name: /The Workforce Brief/ })
    ).toBeInTheDocument();
    expect(
      within(nav).getByRole("link", { name: /Cash Flow Statement/ })
    ).toBeInTheDocument();
    expect(within(nav).getAllByRole("link")).toHaveLength(5);
  });

  it("routes each tab link to its own href", () => {
    render(<ReportTabsBar />);
    expect(
      screen.getByRole("link", { name: /Balance Sheet/ })
    ).toHaveAttribute("href", "/reports/balance-sheet");
  });

  it("treats a round results page as the active Workforce Brief tab", () => {
    mockPathname = "/round/abc-123/results";
    render(<ReportTabsBar />);
    const brief = screen.getByRole("link", { name: /The Workforce Brief/ });
    // "active" state fixes text color; assert via the design-token color class
    // used only for the active tab, as a secondary check alongside the route match.
    expect(brief.className).toContain("text-[var(--portal-primary)]");
    mockPathname = "/reports/workforce-brief";
  });
});
