import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NavbarClient } from "../NavbarClient";

let mockPathname = "/";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

// isSupabaseConfigured() is false in this test environment (no
// NEXT_PUBLIC_SUPABASE_* env vars), so the auth-loading effect exits early
// and the navbar renders its logged-out, "not configured" state.

describe("NavbarClient", () => {
  it("renders nothing on a portal-chrome path, deferring to PortalShell instead", () => {
    mockPathname = "/dashboard";
    const { container } = render(<NavbarClient />);
    expect(container).toBeEmptyDOMElement();
    mockPathname = "/";
  });

  it("renders nothing on nested portal paths too", () => {
    mockPathname = "/sessions/manage";
    const { container } = render(<NavbarClient />);
    expect(container).toBeEmptyDOMElement();
    mockPathname = "/";
  });

  it("renders the marketing navbar with a Simulator link on a non-portal path", () => {
    mockPathname = "/pricing";
    render(<NavbarClient />);
    expect(
      screen.getByRole("link", { name: /Real HR Simulation/ })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Simulator" })).toBeInTheDocument();
  });

  it("does not show a matching prefix path as portal chrome (e.g. /dashboards)", () => {
    // Guards the exact isPortalPath boundary: "/dashboards" starts with
    // "/dashboard" as a raw string but is not actually under that route.
    mockPathname = "/dashboards";
    render(<NavbarClient />);
    expect(
      screen.getByRole("link", { name: /Real HR Simulation/ })
    ).toBeInTheDocument();
  });

  it("shows no Sign in/Register links since Supabase is not configured in this environment", () => {
    mockPathname = "/";
    render(<NavbarClient />);
    expect(screen.queryByRole("link", { name: "Sign in" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Register" })).not.toBeInTheDocument();
  });

  it("toggles the mobile menu open and closed via its accessible name", async () => {
    const user = userEvent.setup();
    mockPathname = "/";
    render(<NavbarClient />);

    const toggle = screen.getByRole("button", { name: "Open menu" });
    await user.click(toggle);
    expect(screen.getByRole("button", { name: "Close menu" })).toBeInTheDocument();
  });
});
