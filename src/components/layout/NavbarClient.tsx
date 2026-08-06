"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { Menu, X } from "lucide-react";
import type { User } from "@supabase/supabase-js";

const PORTAL_PREFIXES = [
  "/dashboard",
  "/decisions",
  "/review",
  "/round",
  "/history",
  "/reports",
  "/team",
  "/resources",
  "/help",
  "/leaderboard",
  "/join",
  "/sessions",
  "/admin",
];

function isPortalPath(path: string) {
  return PORTAL_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}/`)
  );
}

type Profile = {
  role: "instructor" | "student" | "admin";
  display_name: string;
};

function roleHome(role: Profile["role"] | undefined) {
  if (role === "admin") return "/admin";
  if (role === "instructor") return "/sessions";
  return "/dashboard";
}

function roleLabel(role: Profile["role"] | undefined) {
  if (role === "admin") return "Admin";
  if (role === "instructor") return "Instructor";
  return "Student";
}

export function NavbarClient() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [studentHasTeam, setStudentHasTeam] = useState(true);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    const supabase = createClient();

    async function load() {
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      setUser(u);
      if (u) {
        const { data: p } = await supabase
          .from("profiles")
          .select("role, display_name")
          .eq("id", u.id)
          .single();
        setProfile(p as Profile | null);
        if (p?.role === "student") {
          const { data: membership } = await supabase
            .from("team_members")
            .select("team_id")
            .eq("user_id", u.id)
            .maybeSingle();
          setStudentHasTeam(!!membership);
        } else {
          setStudentHasTeam(true);
        }
      } else {
        setProfile(null);
        setStudentHasTeam(true);
      }
      setLoading(false);
    }

    void load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void load();
    });

    return () => subscription.unsubscribe();
  }, [configured]);

  // Portal pages use Capsim-style shell chrome instead of the marketing navbar.
  if (!loading && user && isPortalPath(pathname)) {
    return null;
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
    setMobileOpen(false);
    router.push("/");
    router.refresh();
  }

  const initials = profile?.display_name
    ? profile.display_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  const homeHref = roleHome(profile?.role);

  const navLinks = (
    <>
      {user && profile?.role === "admin" ? (
        <>
          <Link
            href="/admin"
            className="text-[var(--portal-muted)] hover:text-[var(--portal-title)]"
            onClick={() => setMobileOpen(false)}
          >
            Admin
          </Link>
          <Link
            href="/admin/users"
            className="text-[var(--portal-muted)] hover:text-[var(--portal-title)]"
            onClick={() => setMobileOpen(false)}
          >
            Users
          </Link>
          <Link
            href="/sessions/config"
            className="text-[var(--portal-muted)] hover:text-[var(--portal-title)]"
            onClick={() => setMobileOpen(false)}
          >
            Configuration
          </Link>
        </>
      ) : user && profile?.role === "instructor" ? (
        <>
          <Link
            href="/sessions"
            className="text-[var(--portal-muted)] hover:text-[var(--portal-title)]"
            onClick={() => setMobileOpen(false)}
          >
            Dashboard
          </Link>
          <Link
            href="/sessions/config"
            className="text-[var(--portal-muted)] hover:text-[var(--portal-title)]"
            onClick={() => setMobileOpen(false)}
          >
            Configuration
          </Link>
          <Link
            href="/sessions/testing"
            className="text-[var(--portal-muted)] hover:text-[var(--portal-title)]"
            onClick={() => setMobileOpen(false)}
          >
            Testing
          </Link>
        </>
      ) : user && profile?.role === "student" ? (
        <>
          <Link
            href="/dashboard"
            className="text-[var(--portal-muted)] hover:text-[var(--portal-title)]"
            onClick={() => setMobileOpen(false)}
          >
            Dashboard
          </Link>
          <Link
            href="/history"
            className="text-[var(--portal-muted)] hover:text-[var(--portal-title)]"
            onClick={() => setMobileOpen(false)}
          >
            Reports
          </Link>
          {!studentHasTeam && (
            <Link
              href="/join"
              className="font-medium text-[var(--portal-primary)] hover:text-[var(--portal-primary-hover)]"
              onClick={() => setMobileOpen(false)}
            >
              Join team
            </Link>
          )}
        </>
      ) : (
        <Link
          href="/simulate"
          className="text-[var(--portal-muted)] hover:text-[var(--portal-title)]"
          onClick={() => setMobileOpen(false)}
        >
          Simulator
        </Link>
      )}
    </>
  );

  const authSection = loading ? (
    <span className="h-8 w-16 animate-pulse rounded bg-slate-200" />
  ) : user ? (
    <div className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-[var(--portal-sidebar-border)] bg-white py-1 pl-1 pr-3 shadow-sm hover:bg-[var(--portal-page)]"
        aria-label="Account menu"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--portal-primary)] text-xs font-semibold text-white">
          {initials}
        </span>
        <span className="hidden max-w-[120px] truncate text-sm font-medium text-[var(--portal-ink)] sm:inline">
          {profile?.display_name ?? "Account"}
        </span>
      </button>
      {menuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-48 rounded-lg border border-[var(--portal-sidebar-border)] bg-white py-1 shadow-lg">
            <p className="border-b border-slate-100 px-3 py-2 text-xs text-[var(--portal-muted)]">
              {roleLabel(profile?.role)}
            </p>
            <Link
              href={homeHref}
              className="block px-3 py-2 text-sm text-[var(--portal-ink)] hover:bg-[var(--portal-page)]"
              onClick={() => setMenuOpen(false)}
            >
              Go to{" "}
              {profile?.role === "admin"
                ? "admin"
                : profile?.role === "instructor"
                  ? "sessions"
                  : "dashboard"}
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  ) : configured ? (
    <div className="flex items-center gap-2">
      <Link
        href="/login"
        className="text-sm text-[var(--portal-muted)] hover:text-[var(--portal-title)]"
        onClick={() => setMobileOpen(false)}
      >
        Sign in
      </Link>
      <Link
        href="/register"
        className="inline-flex h-9 items-center rounded-lg bg-[var(--portal-primary)] px-3 text-sm font-medium text-white hover:bg-[var(--portal-primary-hover)]"
        onClick={() => setMobileOpen(false)}
      >
        Register
      </Link>
    </div>
  ) : null;

  return (
    <header className="sticky top-0 z-30 w-full min-w-0 border-b border-[var(--portal-sidebar-border)] bg-white">
      <div className="mx-auto flex h-14 w-full min-w-0 max-w-6xl items-center justify-between gap-2 px-4 sm:gap-4">
        <Link
          href={user ? homeHref : "/"}
          className="min-w-0 truncate text-sm font-semibold text-[var(--portal-primary)] sm:text-base"
          onClick={() => setMobileOpen(false)}
        >
          <span className="sm:hidden">HR Simulation</span>
          <span className="hidden sm:inline">Real HR Simulation</span>
        </Link>

        <nav className="hidden min-w-0 items-center gap-5 text-sm md:flex">
          {navLinks}
          {authSection}
        </nav>

        <div className="flex shrink-0 items-center md:hidden">
          <button
            type="button"
            className="rounded-lg p-2 text-[var(--portal-muted)] hover:bg-[#f1f3f5]"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t border-[var(--portal-sidebar-border)] bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3 text-sm">
            {navLinks}
            <div className="border-t border-slate-100 pt-3">
              {loading ? (
                <span className="block h-8 w-24 animate-pulse rounded bg-slate-200" />
              ) : user ? (
                <>
                  <p className="mb-2 text-xs text-[var(--portal-muted)]">
                    {profile?.display_name ?? "Account"} ·{" "}
                    {roleLabel(profile?.role)}
                  </p>
                  <Link
                    href={homeHref}
                    className="mb-2 block text-[var(--portal-ink)]"
                    onClick={() => setMobileOpen(false)}
                  >
                    Go to home
                  </Link>
                  <button
                    type="button"
                    onClick={signOut}
                    className="text-left text-sm text-red-600"
                  >
                    Sign out
                  </button>
                </>
              ) : configured ? (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/login"
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-[var(--portal-sidebar-border)] text-[var(--portal-ink)]"
                    onClick={() => setMobileOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-[var(--portal-primary)] font-medium text-white"
                    onClick={() => setMobileOpen(false)}
                  >
                    Register
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
