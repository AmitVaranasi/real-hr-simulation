"use client";

import Link from "next/link";
import { CircleHelp, LogOut, Menu, Monitor, X } from "lucide-react";
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
  reportsMode = false,
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
  reportsMode?: boolean;
}) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-[var(--portal-sidebar-border)] bg-white">
      <div className="flex h-[var(--portal-topbar-height)] w-full items-center justify-between gap-3 px-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-1.5">
          {!reportsMode ? (
            <>
              <button
                type="button"
                className="rounded-md p-1.5 text-[var(--portal-ink)] hover:bg-[#f4f5f7] lg:hidden"
                onClick={onToggleMobile}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
              >
                {mobileOpen ? (
                  <X className="h-5 w-5" strokeWidth={1.75} />
                ) : (
                  <Menu className="h-5 w-5" strokeWidth={1.75} />
                )}
              </button>
              <button
                type="button"
                className="hidden rounded-md p-1.5 text-[var(--portal-ink)] hover:bg-[#f4f5f7] lg:inline-flex"
                onClick={onToggleMobile}
                aria-label="Toggle menu"
              >
                <Menu className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </>
          ) : null}
          {showBrandInBar ? (
            <Link
              href={homeHref}
              className="truncate text-[24px] font-bold leading-none tracking-tight text-[var(--portal-brand)]"
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
          {reportsMode ? (
            <p className="hidden min-w-0 truncate text-sm text-[var(--portal-ink)] sm:block">
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
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          {reportsMode ? (
            <span className="rounded-md bg-[var(--portal-navy)] px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide text-white">
              Student
            </span>
          ) : roleLabel === "Instructor" || roleLabel === "Admin" ? (
            <span className="hidden text-[0.8125rem] font-medium text-[var(--portal-navy)] sm:inline">
              {roleLabel}
            </span>
          ) : (
            <Link
              href="/simulate"
              className="hidden items-center gap-1.5 text-[0.8125rem] font-medium text-[var(--portal-navy)] hover:text-[var(--portal-brand)] sm:inline-flex"
            >
              <Monitor
                className="h-4 w-4 text-[var(--portal-navy)]"
                strokeWidth={1.75}
              />
              Simulator
            </Link>
          )}
          <Link
            href={helpHref}
            className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-[var(--portal-navy)] hover:text-[var(--portal-primary)]"
          >
            <CircleHelp
              className="h-4 w-4 text-[var(--portal-primary)]"
              strokeWidth={1.75}
            />
            <span className="hidden sm:inline">Help</span>
          </Link>
          <button
            type="button"
            onClick={() => void signOut()}
            className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-[var(--portal-navy)] hover:text-[var(--portal-primary)]"
          >
            <LogOut
              className="h-4 w-4 text-[var(--portal-primary)]"
              strokeWidth={1.75}
            />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
