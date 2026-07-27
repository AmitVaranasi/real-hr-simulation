"use client";

import { PortalShell } from "./PortalShell";

export function StudentPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PortalShell role="student">{children}</PortalShell>;
}
