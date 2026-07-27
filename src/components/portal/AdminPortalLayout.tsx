"use client";

import { PortalShell } from "./PortalShell";

export function AdminPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PortalShell role="admin">{children}</PortalShell>;
}
