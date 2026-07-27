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
}: {
  displayName: string;
  roleLabel: string;
  contextTitle: string;
  contextMeta?: string | null;
  mobileOpen: boolean;
  onToggleMobile: () => void;
}) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 border-b border-[#dde1e6] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="flex h-14 items-center justify-between gap-3 px-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="rounded-md p-2 text-[#1f2937] hover:bg-[#f4f5f7] lg:hidden"
            onClick={onToggleMobile}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm text-[#1f2937]">
              Welcome back{" "}
              <span className="font-semibold">{displayName}</span>
              {contextMeta ? (
                <>
                  {" "}
                  <span className="text-[#6b7280]">|</span>{" "}
                  <span className="text-[#6b7280]">{contextMeta}</span>
                </>
              ) : null}
            </p>
            <p className="truncate text-xs font-medium text-[#6b7280]">
              {contextTitle}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden rounded border border-[#dde1e6] bg-[#f4f5f7] px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#6b7280] sm:inline">
            {roleLabel}
          </span>
          <Link
            href="/about"
            className="inline-flex items-center gap-1.5 rounded border border-[#dde1e6] bg-white px-2.5 py-1.5 text-xs font-medium text-[#1f2937] hover:bg-[#f4f5f7]"
          >
            <CircleHelp className="h-3.5 w-3.5 text-[#2563eb]" strokeWidth={2} />
            <span className="hidden sm:inline">Help</span>
          </Link>
          <button
            type="button"
            onClick={() => void signOut()}
            className="inline-flex items-center gap-1.5 rounded border border-[#dde1e6] bg-white px-2.5 py-1.5 text-xs font-medium text-[#1f2937] hover:bg-[#f4f5f7]"
          >
            <LogOut className="h-3.5 w-3.5 text-[#2563eb]" strokeWidth={2} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
