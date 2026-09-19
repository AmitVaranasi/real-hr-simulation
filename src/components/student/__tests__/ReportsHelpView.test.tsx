import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReportsHelpView } from "../help/ReportsHelpView";

describe("ReportsHelpView", () => {
  it("renders the report topics grid with working links", () => {
    render(<ReportsHelpView />);
    const overview = screen.getByRole("link", { name: /Overview/ });
    expect(overview).toHaveAttribute("href", "/help/reports#overview");
  });

  it("links out to the reports and analytics area", () => {
    render(<ReportsHelpView />);
    expect(
      screen.getByRole("link", { name: /Go to Reports & HR Analytics/ })
    ).toHaveAttribute("href", "/reports/workforce-brief");
  });

  it("links to the HR metrics reference from the sidebar tip", () => {
    render(<ReportsHelpView />);
    expect(
      screen.getByRole("link", { name: /Go to HR Metrics Reference/ })
    ).toHaveAttribute("href", "/resources/metrics");
  });
});
