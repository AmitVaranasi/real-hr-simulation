import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProfessorRoleNav, StudentRoleNav } from "../RoleNav";

let mockPathname = "/dashboard";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

describe("StudentRoleNav", () => {
  afterEach(() => {
    mockPathname = "/dashboard";
  });

  it("omits Decisions and Review links when there is no open round", () => {
    render(<StudentRoleNav openRoundId={null} />);
    expect(
      screen.queryByRole("link", { name: "Decisions" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
  });

  it("adds round-scoped Decisions and Review links once a round is open", () => {
    render(<StudentRoleNav openRoundId="round-42" />);
    expect(screen.getByRole("link", { name: "Decisions" })).toHaveAttribute(
      "href",
      "/round/round-42/decisions"
    );
    expect(screen.getByRole("link", { name: "Review & Submit" })).toHaveAttribute(
      "href",
      "/round/round-42/review"
    );
  });

  it("marks Decisions as the active link on a decisions sub-route", () => {
    mockPathname = "/round/round-42/decisions?tab=training";
    render(<StudentRoleNav openRoundId="round-42" />);
    const decisions = screen.getByRole("link", { name: "Decisions" });
    // "active" state is the only observable signal for a same-page nav
    // highlight; assert it as a secondary check alongside the link existing.
    expect(decisions.className).toContain("text-[var(--portal-primary)]");
  });
});

describe("ProfessorRoleNav", () => {
  afterEach(() => {
    mockPathname = "/dashboard";
  });

  it("omits session-scoped Course and Reports links without a sessionId", () => {
    render(<ProfessorRoleNav sessionId={null} />);
    expect(screen.queryByRole("link", { name: "Course" })).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Configuration" })
    ).toBeInTheDocument();
  });

  it("adds session-scoped Course and Reports links once a sessionId is known", () => {
    render(<ProfessorRoleNav sessionId="sess-7" />);
    expect(screen.getByRole("link", { name: "Course" })).toHaveAttribute(
      "href",
      "/sessions/sess-7"
    );
    expect(screen.getByRole("link", { name: "Reports" })).toHaveAttribute(
      "href",
      "/sessions/sess-7/reports"
    );
  });

  it("does not treat a session's reports sub-path as the active Course link", () => {
    mockPathname = "/sessions/sess-7/reports";
    render(<ProfessorRoleNav sessionId="sess-7" />);
    const course = screen.getByRole("link", { name: "Course" });
    const reports = screen.getByRole("link", { name: "Reports" });
    expect(reports.className).toContain("text-[var(--portal-primary)]");
    expect(course.className).not.toContain("text-[var(--portal-primary)]");
  });
});
