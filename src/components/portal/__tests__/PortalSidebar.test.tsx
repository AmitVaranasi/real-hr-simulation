import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PortalSidebar } from "../PortalSidebar";
import { studentNavItems } from "../portal-nav";
import { markModuleVisited } from "@/lib/student/module-progress";

let mockPathname = "/dashboard";
const mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}));

const ROUND_ID = "11111111-1111-1111-1111-111111111111";

function itemsForRound() {
  return studentNavItems({ openRoundId: ROUND_ID });
}

describe("PortalSidebar", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    mockPathname = "/dashboard";
  });

  it("renders a navigation landmark with the top-level nav links", () => {
    render(
      <PortalSidebar items={itemsForRound()} brandSubtitle="Student Portal" />
    );
    const nav = screen.getByRole("navigation");
    expect(
      within(nav).getByRole("link", { name: "Dashboard" })
    ).toBeInTheDocument();
    expect(
      within(nav).getByRole("link", { name: "HR Decisions" })
    ).toBeInTheDocument();
  });

  it("expands a branch's children when the expand toggle is clicked, and collapses them again", async () => {
    const user = userEvent.setup();
    // "Team & Company" is not auto-expanded on /dashboard, so it starts collapsed.
    render(
      <PortalSidebar items={itemsForRound()} brandSubtitle="Student Portal" />
    );

    expect(
      screen.queryByRole("link", { name: "Company Profile" })
    ).not.toBeInTheDocument();

    const expandBtn = screen.getByRole("button", {
      name: "Expand Team & Company",
    });
    await user.click(expandBtn);

    expect(
      screen.getByRole("link", { name: "Company Profile" })
    ).toBeInTheDocument();

    const collapseBtn = screen.getByRole("button", {
      name: "Collapse Team & Company",
    });
    await user.click(collapseBtn);

    expect(
      screen.queryByRole("link", { name: "Company Profile" })
    ).not.toBeInTheDocument();
  });

  it("reads previously visited modules from localStorage and marks them complete on mount", () => {
    localStorage.setItem(
      `hr-module-visited:${ROUND_ID}`,
      JSON.stringify(["recruitment"])
    );
    mockPathname = `/round/${ROUND_ID}/review`;

    render(
      <PortalSidebar items={itemsForRound()} brandSubtitle="Student Portal" />
    );

    const recruitmentLink = screen.getByRole("link", {
      name: "Recruitment & Selection",
    });
    expect(
      recruitmentLink.querySelector("svg.lucide-check")
    ).toBeInTheDocument();

    const performanceLink = screen.getByRole("link", {
      name: "Performance Management",
    });
    expect(
      performanceLink.querySelector("svg.lucide-check")
    ).not.toBeInTheDocument();
  });

  it("marks a module complete live when a visit event fires for the currently open round", async () => {
    mockPathname = `/round/${ROUND_ID}/review`;

    render(
      <PortalSidebar items={itemsForRound()} brandSubtitle="Student Portal" />
    );

    const trainingLink = screen.getByRole("link", {
      name: "Training & Development",
    });
    expect(
      trainingLink.querySelector("svg.lucide-check")
    ).not.toBeInTheDocument();

    markModuleVisited(ROUND_ID, "training");

    await waitFor(() => {
      expect(
        trainingLink.querySelector("svg.lucide-check")
      ).toBeInTheDocument();
    });
  });

  it("ignores a visit event for a different round than the one currently open", () => {
    mockPathname = `/round/${ROUND_ID}/review`;
    render(
      <PortalSidebar items={itemsForRound()} brandSubtitle="Student Portal" />
    );

    markModuleVisited("22222222-2222-2222-2222-222222222222", "training");

    const trainingLink = screen.getByRole("link", {
      name: "Training & Development",
    });
    expect(
      trainingLink.querySelector("svg.lucide-check")
    ).not.toBeInTheDocument();
  });

  it("renders an empty aside and no navigation when collapsed", () => {
    render(
      <PortalSidebar
        items={itemsForRound()}
        brandSubtitle="Student Portal"
        collapsed
      />
    );
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("shows the student quick links section only when showStudentChrome is true", () => {
    const { rerender } = render(
      <PortalSidebar items={itemsForRound()} brandSubtitle="Student Portal" />
    );
    expect(
      screen.queryByText("Quick Links")
    ).not.toBeInTheDocument();

    rerender(
      <PortalSidebar
        items={itemsForRound()}
        brandSubtitle="Student Portal"
        showStudentChrome
      />
    );
    expect(screen.getByText("Quick Links")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Messages" })
    ).toBeInTheDocument();
  });

  it("renders the simulation summary panel only when a simulation is supplied", () => {
    render(
      <PortalSidebar
        items={itemsForRound()}
        brandSubtitle="Student Portal"
        showStudentChrome
        simulation={{
          company: "Acme Corp",
          course: "HR 301",
          industry: "Tech",
          strategy: "Growth",
          roundLabel: "Round 2",
        }}
      />
    );
    expect(screen.getByText("Your Simulation")).toBeInTheDocument();
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
  });
});
