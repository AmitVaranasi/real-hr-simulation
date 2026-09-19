import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProfessorPortalLayout } from "../ProfessorPortalLayout";
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

describe("ProfessorPortalLayout", () => {
  it("wires PortalShell with the instructor role, not any other role", () => {
    render(
      <ProfessorPortalLayout>
        <p>Professor page</p>
      </ProfessorPortalLayout>
    );
    expect(screen.getByText("shell role: instructor")).toBeInTheDocument();
  });

  it("passes its children through to PortalShell unchanged", () => {
    render(
      <ProfessorPortalLayout>
        <p>Professor page</p>
      </ProfessorPortalLayout>
    );
    expect(screen.getByText("Professor page")).toBeInTheDocument();
  });
});
