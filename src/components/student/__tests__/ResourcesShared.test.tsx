import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  ResourcesBreadcrumb,
  ResourcesContextCards,
  ResourcesFooter,
  ResourcesInfoBanner,
  ResourcesSearchRow,
  ResourcesSideCard,
} from "../resources/ResourcesShared";
import { Users } from "lucide-react";

describe("ResourcesShared", () => {
  describe("ResourcesContextCards", () => {
    it("renders an OPEN badge only when the round is open", () => {
      const { rerender } = render(
        <ResourcesContextCards
          context={{
            roundLabel: "Round 1",
            roundOpen: false,
            industry: "Tech",
            strategy: "Cost",
            economy: "Growth",
          }}
        />
      );
      expect(screen.queryByText("OPEN")).not.toBeInTheDocument();

      rerender(
        <ResourcesContextCards
          context={{
            roundLabel: "Round 1",
            roundOpen: true,
            industry: "Tech",
            strategy: "Cost",
            economy: "Growth",
          }}
        />
      );
      expect(screen.getByText("OPEN")).toBeInTheDocument();
    });
  });

  describe("ResourcesInfoBanner", () => {
    it("renders its children content", () => {
      render(<ResourcesInfoBanner>Read this carefully.</ResourcesInfoBanner>);
      expect(screen.getByText("Read this carefully.")).toBeInTheDocument();
    });
  });

  describe("ResourcesBreadcrumb", () => {
    it("links back to the resources index and shows the current page name", () => {
      render(<ResourcesBreadcrumb current="Learning Guides" />);
      expect(
        screen.getByRole("link", { name: "Resources" })
      ).toHaveAttribute("href", "/resources");
      expect(screen.getByText("Learning Guides")).toBeInTheDocument();
    });
  });

  describe("ResourcesFooter", () => {
    it("defaults to linking back to the resources index", () => {
      render(<ResourcesFooter />);
      expect(
        screen.getByRole("link", { name: "← Back to Resources" })
      ).toHaveAttribute("href", "/resources");
      expect(
        screen.getByRole("link", { name: "Back to Dashboard →" })
      ).toHaveAttribute("href", "/dashboard");
    });

    it("accepts a custom back link and label", () => {
      render(<ResourcesFooter backHref="/resources/metrics" backLabel="Back to Metrics" />);
      expect(
        screen.getByRole("link", { name: "← Back to Metrics" })
      ).toHaveAttribute("href", "/resources/metrics");
    });
  });

  describe("ResourcesSearchRow", () => {
    it("labels the search input via its wrapping label so it's a real search field", () => {
      render(<ResourcesSearchRow placeholder="Search guides..." />);
      const input = screen.getByPlaceholderText("Search guides...");
      expect(input).toHaveAttribute("type", "search");
      // The wrapping <label> carries sr-only text matching the placeholder,
      // so the field has a real accessible name beyond its decorative icon.
      expect(
        screen.getByRole("searchbox", { name: "Search guides..." })
      ).toBe(input);
    });
  });

  describe("ResourcesSideCard", () => {
    it("renders its title, icon-driven heading, and children", () => {
      render(
        <ResourcesSideCard title="Need help?" icon={Users}>
          <p>Contact your instructor.</p>
        </ResourcesSideCard>
      );
      expect(
        screen.getByRole("heading", { name: "Need help?" })
      ).toBeInTheDocument();
      expect(screen.getByText("Contact your instructor.")).toBeInTheDocument();
    });

    it("renders an optional footer only when provided", () => {
      const { rerender } = render(
        <ResourcesSideCard title="Card" icon={Users}>
          Body
        </ResourcesSideCard>
      );
      expect(screen.queryByText("Footer content")).not.toBeInTheDocument();

      rerender(
        <ResourcesSideCard
          title="Card"
          icon={Users}
          footer={<span>Footer content</span>}
        >
          Body
        </ResourcesSideCard>
      );
      expect(screen.getByText("Footer content")).toBeInTheDocument();
    });
  });
});
