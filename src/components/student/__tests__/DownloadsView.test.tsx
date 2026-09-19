import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DownloadsView } from "../resources/DownloadsView";
import type { ResourcesContext } from "../resources/ResourcesShared";

const context: ResourcesContext = {
  roundLabel: "Round 1",
  roundOpen: false,
  industry: "Manufacturing",
  strategy: "Focus",
  economy: "normal",
};

describe("DownloadsView", () => {
  it("lists both simulation and course downloads with accessibly labelled download buttons", () => {
    render(<DownloadsView context={context} />);
    expect(screen.getByText("Student Simulation Guide")).toBeInTheDocument();
    expect(screen.getByText("Course Syllabus")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Download Student Simulation Guide" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Download Course Syllabus" })
    ).toBeInTheDocument();
  });

  it("groups downloads under separate simulation and course resource tables", () => {
    render(<DownloadsView context={context} />);
    expect(
      screen.getByText("Simulation Resources (Provided by Simulation Team)")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Course Resources (Provided by Your Instructor)")
    ).toBeInTheDocument();
  });

  it("shows the resources breadcrumb and links back to Resources and the Dashboard", () => {
    render(<DownloadsView context={context} />);
    expect(
      screen.getByRole("heading", { name: "Downloads & Course Resources" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "← Back to Resources" })
    ).toHaveAttribute("href", "/resources");
    expect(
      screen.getByRole("link", { name: "Back to Dashboard →" })
    ).toHaveAttribute("href", "/dashboard");
  });

  it("links to the Help Center from the sidebar", () => {
    render(<DownloadsView context={context} />);
    expect(
      screen.getByRole("link", { name: /Go to Help Center/ })
    ).toHaveAttribute("href", "/help");
  });
});
