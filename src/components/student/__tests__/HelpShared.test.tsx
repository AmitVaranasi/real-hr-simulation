import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Rocket } from "lucide-react";
import {
  HelpAccordionItem,
  HelpBreadcrumb,
  HelpPageHeader,
  HelpQuickLinksPanel,
  HelpSideCard,
  HelpTopicGridCard,
} from "../help/HelpShared";

describe("HelpShared", () => {
  describe("HelpBreadcrumb", () => {
    it("links back to the Help Center and shows the current page", () => {
      render(<HelpBreadcrumb current="FAQ" />);
      expect(
        screen.getByRole("link", { name: "Help Center" })
      ).toHaveAttribute("href", "/help");
      expect(screen.getByText("FAQ")).toBeInTheDocument();
    });
  });

  describe("HelpPageHeader", () => {
    it("renders the title and subtitle, with the breadcrumb optional", () => {
      const { rerender } = render(
        <HelpPageHeader title="Getting Started" subtitle="Learn the basics." />
      );
      expect(
        screen.getByRole("heading", { name: "Getting Started" })
      ).toBeInTheDocument();
      expect(screen.getByText("Learn the basics.")).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "Help Center" })).not.toBeInTheDocument();

      rerender(
        <HelpPageHeader
          breadcrumb="Getting Started"
          title="Getting Started"
          subtitle="Learn the basics."
        />
      );
      expect(
        screen.getByRole("link", { name: "Help Center" })
      ).toBeInTheDocument();
    });
  });

  describe("HelpSideCard", () => {
    it("renders the given title and children", () => {
      render(
        <HelpSideCard title="Need more help?" icon={Rocket}>
          <p>Reach out to support.</p>
        </HelpSideCard>
      );
      expect(
        screen.getByRole("heading", { name: "Need more help?" })
      ).toBeInTheDocument();
      expect(screen.getByText("Reach out to support.")).toBeInTheDocument();
    });
  });

  describe("HelpQuickLinksPanel", () => {
    it("renders every configured quick link as a real link", () => {
      render(<HelpQuickLinksPanel />);
      expect(
        screen.getByRole("heading", { name: "Quick Links" })
      ).toBeInTheDocument();
      const links = screen.getAllByRole("link");
      expect(links.length).toBeGreaterThan(0);
      for (const link of links) {
        expect(link).toHaveAttribute("href");
      }
    });
  });

  describe("HelpAccordionItem", () => {
    it("toggles its body via a button with aria-expanded reflecting state", async () => {
      const user = userEvent.setup();
      const onToggle = vi.fn();
      const { rerender } = render(
        <HelpAccordionItem
          open={false}
          onToggle={onToggle}
          icon={Rocket}
          title="How do I join a team?"
          summary="Enter the code from your instructor."
        >
          <p>Full answer text.</p>
        </HelpAccordionItem>
      );

      const button = screen.getByRole("button", {
        name: /How do I join a team\?/,
      });
      expect(button).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByText("Full answer text.")).not.toBeInTheDocument();

      await user.click(button);
      expect(onToggle).toHaveBeenCalledTimes(1);

      rerender(
        <HelpAccordionItem
          open={true}
          onToggle={onToggle}
          icon={Rocket}
          title="How do I join a team?"
          summary="Enter the code from your instructor."
        >
          <p>Full answer text.</p>
        </HelpAccordionItem>
      );
      expect(button).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByText("Full answer text.")).toBeInTheDocument();
    });
  });

  describe("HelpTopicGridCard", () => {
    it("renders as a link carrying the numbered title and description", () => {
      render(
        <HelpTopicGridCard
          number="1"
          title="Getting Started"
          description="Learn the basics before round one."
          href="/help/getting-started"
          icon={Rocket}
        />
      );
      const link = screen.getByRole("link", {
        name: /Getting Started/,
      });
      expect(link).toHaveAttribute("href", "/help/getting-started");
      expect(
        screen.getByText("Learn the basics before round one.")
      ).toBeInTheDocument();
    });
  });
});
