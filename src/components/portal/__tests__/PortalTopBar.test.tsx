import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PortalTopBar } from "../PortalTopBar";

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

const signOut = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signOut } }),
}));

function baseProps() {
  return {
    displayName: "Jamie Rivera",
    roleLabel: "Student",
    contextTitle: "Student Portal",
    mobileOpen: false,
    onToggleMobile: vi.fn(),
  };
}

describe("PortalTopBar", () => {
  it("shows the welcome message with the display name and context title by default", () => {
    render(<PortalTopBar {...baseProps()} />);
    expect(screen.getByText("Jamie Rivera")).toBeInTheDocument();
    expect(screen.getByText("Student Portal")).toBeInTheDocument();
  });

  it("renders the brand link instead of the welcome text when showBrandInBar is set", () => {
    render(<PortalTopBar {...baseProps()} showBrandInBar />);
    expect(
      screen.getByRole("link", { name: "Real HR Simulation" })
    ).toBeInTheDocument();
    expect(screen.queryByText("Jamie Rivera")).not.toBeInTheDocument();
  });

  it("toggles the mobile menu button's accessible name with the open state", () => {
    const { rerender } = render(<PortalTopBar {...baseProps()} mobileOpen={false} />);
    expect(screen.getByRole("button", { name: "Open menu" })).toBeInTheDocument();

    rerender(<PortalTopBar {...baseProps()} mobileOpen />);
    expect(screen.getByRole("button", { name: "Close menu" })).toBeInTheDocument();
  });

  it("calls onToggleMobile when the mobile menu button is clicked", async () => {
    const user = userEvent.setup();
    const onToggleMobile = vi.fn();
    render(<PortalTopBar {...baseProps()} onToggleMobile={onToggleMobile} />);
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    expect(onToggleMobile).toHaveBeenCalledTimes(1);
  });

  it("links Help to the supplied helpHref", () => {
    render(<PortalTopBar {...baseProps()} helpHref="/sessions/help" />);
    expect(screen.getByRole("link", { name: /Help/ })).toHaveAttribute(
      "href",
      "/sessions/help"
    );
  });

  it("signs the user out and redirects home when Logout is clicked", async () => {
    const user = userEvent.setup();
    render(<PortalTopBar {...baseProps()} />);
    await user.click(screen.getByRole("button", { name: /Logout/ }));
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith("/");
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("shows the Simulator link only for non-privileged roles", () => {
    const { rerender } = render(<PortalTopBar {...baseProps()} roleLabel="Instructor" />);
    expect(
      screen.queryByRole("link", { name: /Simulator/ })
    ).not.toBeInTheDocument();

    rerender(<PortalTopBar {...baseProps()} roleLabel="Student" />);
    expect(screen.getByRole("link", { name: /Simulator/ })).toBeInTheDocument();
  });
});
