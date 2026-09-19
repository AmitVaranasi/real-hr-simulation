import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminPortalLayout } from "../AdminPortalLayout";
import type { PortalRole } from "../PortalShell";

vi.mock("../PortalShell", () => ({
  PortalShell: ({
    role,
    children,
  }: {
    role: PortalRole;
    children: React.ReactNode;
  }) => (
    <div data-role={role}>
      <p>shell role: {role}</p>
      {children}
    </div>
  ),
}));

describe("AdminPortalLayout", () => {
  it("wires PortalShell with the admin role, not any other role", () => {
    render(
      <AdminPortalLayout>
        <p>Admin page</p>
      </AdminPortalLayout>
    );
    expect(screen.getByText("shell role: admin")).toBeInTheDocument();
  });

  it("passes its children through to PortalShell unchanged", () => {
    render(
      <AdminPortalLayout>
        <p>Admin page</p>
      </AdminPortalLayout>
    );
    expect(screen.getByText("Admin page")).toBeInTheDocument();
  });
});
