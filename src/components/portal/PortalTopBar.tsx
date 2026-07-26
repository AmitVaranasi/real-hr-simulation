"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
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
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          onClick={onToggleMobile}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">
            {contextTitle}
          </p>
          {contextMeta && (
            <p className="truncate text-xs text-slate-500">{contextMeta}</p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <span className="hidden text-xs text-slate-500 sm:inline">
          Welcome back,{" "}
          <span className="font-medium text-slate-800">{displayName}</span>
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-600">
          {roleLabel}
        </span>
        <Link
          href="/"
          className="hidden text-xs text-slate-500 hover:text-slate-800 sm:inline"
        >
          Help
        </Link>
        <button
          type="button"
          onClick={() => void signOut()}
          className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
