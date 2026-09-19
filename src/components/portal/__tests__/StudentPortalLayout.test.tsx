import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StudentPortalLayout } from "../StudentPortalLayout";
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

describe("StudentPortalLayout", () => {
  it("wires PortalShell with the student role, not any other role", () => {
    render(
      <StudentPortalLayout>
        <p>Student page</p>
      </StudentPortalLayout>
    );
    expect(screen.getByText("shell role: student")).toBeInTheDocument();
  });

  it("passes its children through to PortalShell unchanged", () => {
    render(
      <StudentPortalLayout>
        <p>Student page</p>
      </StudentPortalLayout>
    );
    expect(screen.getByText("Student page")).toBeInTheDocument();
  });
});
