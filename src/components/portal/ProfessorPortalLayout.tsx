"use client";

import { PortalShell } from "./PortalShell";

export function ProfessorPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PortalShell role="instructor">{children}</PortalShell>;
}
