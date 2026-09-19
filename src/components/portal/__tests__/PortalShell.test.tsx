import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PortalShell } from "../PortalShell";

let mockPathname = "/dashboard";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

// jsdom does not implement matchMedia; PortalShell uses it to force-collapse
// the desktop sidebar under a mobile breakpoint.
beforeEach(() => {
  window.matchMedia = vi.fn().mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
});

// isSupabaseConfigured() is false in this test environment (no
// NEXT_PUBLIC_SUPABASE_* env vars), so the shell's data-loading effect
// short-circuits and falls back to its default, unauthenticated copy.

describe("PortalShell", () => {
  it("renders the children inside the main landmark", () => {
    render(
      <PortalShell role="student">
        <p>Student page content</p>
      </PortalShell>
    );
    const main = screen.getByRole("main");
    expect(main).toHaveTextContent("Student page content");
  });

  it("shows the role-appropriate default portal title when unauthenticated", () => {
    // Only the admin role keeps the topbar's welcome/contextTitle text visible
    // (student/instructor swap it for the plain brand link), so it is the one
    // role where the default contextTitle copy is directly assertable here.
    render(
      <PortalShell role="admin">
        <p>content</p>
      </PortalShell>
    );
    expect(screen.getByText("Administrator Portal")).toBeInTheDocument();
  });

  it("labels the admin role badge distinctly from student/instructor", () => {
    render(
      <PortalShell role="admin">
        <p>content</p>
      </PortalShell>
    );
    expect(screen.getAllByText("Admin").length).toBeGreaterThan(0);
  });

  it("opens and closes the mobile sidebar via the menu button", async () => {
    const user = userEvent.setup();
    // toggleNav() branches on window.innerWidth to decide mobile vs desktop
    // toggle; force the mobile branch regardless of jsdom's default width.
    window.innerWidth = 500;
    render(
      <PortalShell role="student">
        <p>content</p>
      </PortalShell>
    );

    // Two nav landmarks exist (desktop + mobile PortalSidebar instances);
    // before opening, only the desktop one's links are reachable via role.
    expect(screen.getAllByRole("link", { name: "Dashboard" })).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.getAllByRole("link", { name: "Dashboard" })).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "Close menu" }));
    expect(screen.getAllByRole("link", { name: "Dashboard" })).toHaveLength(1);
  });

  it("shows reports tabs and hides the sidebar when on a reports route", () => {
    mockPathname = "/reports/workforce-brief";
    render(
      <PortalShell role="student">
        <p>content</p>
      </PortalShell>
    );
    expect(
      screen.getByRole("navigation", { name: "Reports" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Dashboard" })
    ).not.toBeInTheDocument();
    mockPathname = "/dashboard";
  });
});
