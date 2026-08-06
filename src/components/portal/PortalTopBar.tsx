"use client";

import Link from "next/link";
import { CircleHelp, LogOut, Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function PortalTopBar({
  displayName,
  roleLabel,
  contextTitle,
  contextMeta,
  mobileOpen,
  onToggleMobile,
  homeHref = "/dashboard",
  helpHref = "/help",
  showBrandInBar = false,
}: {
  displayName: string;
  roleLabel: string;
  contextTitle: string;
  contextMeta?: string | null;
  mobileOpen: boolean;
  onToggleMobile: () => void;
  homeHref?: string;
  helpHref?: string;
  showBrandInBar?: boolean;
}) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--portal-sidebar-border)] bg-white">
      <div className="flex h-[52px] items-center justify-between gap-3 px-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="rounded-md p-2 text-[var(--portal-ink)] hover:bg-[#f4f5f7]"
            onClick={onToggleMobile}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" strokeWidth={1.75} />
            ) : (
              <Menu className="h-5 w-5" strokeWidth={1.75} />
            )}
          </button>
          {showBrandInBar ? (
            <Link
              href={homeHref}
              className="truncate text-[15px] font-bold tracking-tight text-[var(--portal-primary)] sm:text-base"
            >
              Real HR Simulation
            </Link>
          ) : (
            <div className="min-w-0">
              <p className="truncate text-sm text-[var(--portal-ink)]">
                Welcome back{" "}
                <span className="font-semibold">{displayName}</span>
                {contextMeta ? (
                  <>
                    {" "}
                    <span className="text-[var(--portal-muted)]">|</span>{" "}
                    <span className="text-[var(--portal-muted)]">{contextMeta}</span>
                  </>
                ) : null}
              </p>
              <p className="truncate text-xs font-medium text-[var(--portal-muted)]">
                {contextTitle}
              </p>
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          {roleLabel === "Instructor" || roleLabel === "Admin" ? (
            <span className="hidden text-[13px] font-medium text-[var(--portal-ink)] sm:inline">
              {roleLabel}
            </span>
          ) : (
            <Link
              href="/simulate"
              className="hidden text-[13px] font-medium text-[var(--portal-ink)] hover:text-[var(--portal-primary)] sm:inline"
            >
              Simulator
            </Link>
          )}
          <Link
            href={helpHref}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--portal-ink)] hover:text-[var(--portal-accent-blue)]"
          >
            <CircleHelp
              className="h-4 w-4 text-[var(--portal-accent-blue)]"
              strokeWidth={1.75}
            />
            <span className="hidden sm:inline">Help</span>
          </Link>
          <button
            type="button"
            onClick={() => void signOut()}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--portal-ink)] hover:text-[var(--portal-accent-blue)]"
          >
            <LogOut
              className="h-4 w-4 text-[var(--portal-accent-blue)]"
              strokeWidth={1.75}
            />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
