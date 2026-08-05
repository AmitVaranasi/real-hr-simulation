"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  PortalSidebar,
  type StudentSimulationSummary,
} from "./PortalSidebar";
import { PortalTopBar } from "./PortalTopBar";
import {
  adminNavItems,
  professorNavItems,
  studentNavItems,
  type PortalNavItem,
} from "./portal-nav";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type PortalRole = "instructor" | "student" | "admin";

function roleHomeLabel(role: PortalRole) {
  if (role === "admin") return "Administrator Portal";
  if (role === "instructor") return "Professor Portal";
  return "Student Portal";
}

function roleBadge(role: PortalRole) {
  if (role === "admin") return "Admin";
  if (role === "instructor") return "Instructor";
  return "Student";
}

function PortalShellInner({
  role,
  children,
}: {
  role: PortalRole;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [displayName, setDisplayName] = useState("User");
  const [contextTitle, setContextTitle] = useState(roleHomeLabel(role));
  const [contextMeta, setContextMeta] = useState<string | null>(null);
  const [openRoundId, setOpenRoundId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [hasTeam, setHasTeam] = useState(false);
  const [simulation, setSimulation] =
    useState<StudentSimulationSummary | null>(null);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 1023px)");
    const apply = () => {
      if (mq.matches) setDesktopCollapsed(false);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, role")
        .eq("id", user.id)
        .single();
      if (profile?.display_name) setDisplayName(profile.display_name);

      if (role === "student") {
        const res = await fetch("/api/student/dashboard", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setOpenRoundId(data.openRound?.id ?? null);
          setHasTeam(Boolean(data.hasTeam));
          setSimulation(data.simulation ?? null);
          if (data.hasTeam && data.simulation) {
            setContextTitle(`${data.simulation.company} Dashboard`);
            setContextMeta(
              [
                data.simulation.course,
                data.simulation.industry,
                data.simulation.strategy,
              ]
                .filter(Boolean)
                .join(" · ")
            );
          } else {
            setContextTitle("Student Portal");
            setContextMeta("Join a team to begin");
          }
        } else {
          setHasTeam(false);
          setSimulation(null);
          setContextTitle("Student Portal");
          setContextMeta("Join a team to begin");
        }
      } else if (role === "admin") {
        setContextTitle("System administration");
        setContextMeta("User management · configuration · diagnostics");
      } else {
        const sessionMatch = pathname.match(
          /^\/sessions\/([0-9a-f-]{36})(?:\/|$)/i
        );
        const fromPath = sessionMatch?.[1] ?? null;

        const { data: sessions } = await supabase
          .from("sessions")
          .select("id, name, course_code, semester, status")
          .eq("instructor_id", user.id)
          .order("created_at", { ascending: false });

        const active =
          (fromPath
            ? sessions?.find((s) => s.id === fromPath)
            : null) ??
          sessions?.find((s) => s.status === "active") ??
          sessions?.[0] ??
          null;

        setSessionId(active?.id ?? null);
        if (active) {
          setContextTitle(active.name);
          setContextMeta(
            [active.course_code, active.semester, `Status: ${active.status}`]
              .filter(Boolean)
              .join(" · ")
          );
        } else {
          setContextTitle("Professor Portal");
          setContextMeta("Create a session to begin");
        }
      }
    }

    void load();
  }, [role, pathname]);

  const items: PortalNavItem[] = useMemo(() => {
    if (role === "student") return studentNavItems({ openRoundId });
    if (role === "admin") return adminNavItems();
    return professorNavItems({ sessionId });
  }, [role, openRoundId, sessionId]);

  const homeHref =
    role === "student"
      ? hasTeam
        ? "/dashboard"
        : "/dashboard/getting-started"
      : role === "admin"
        ? "/admin"
        : "/sessions";

  function toggleNav() {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setMobileOpen((o) => !o);
    } else {
      setDesktopCollapsed((c) => !c);
    }
  }

  return (
    <div className="min-h-screen bg-[#eef0f3]">
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden overflow-hidden transition-[width] duration-200 lg:block ${
          desktopCollapsed ? "w-0" : "w-[240px]"
        }`}
      >
        {!desktopCollapsed && (
          <PortalSidebar
            items={items}
            brandSubtitle={roleHomeLabel(role)}
            displayName={displayName}
            roleLabel={roleBadge(role)}
            homeHref={homeHref}
            showStudentChrome={role === "student"}
            simulation={role === "student" ? simulation : null}
          />
        )}
      </aside>

      {mobileOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/30 lg:hidden"
            aria-label="Close sidebar"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-[240px] lg:hidden">
            <PortalSidebar
              items={items}
              brandSubtitle={roleHomeLabel(role)}
              displayName={displayName}
              roleLabel={roleBadge(role)}
              homeHref={homeHref}
              showStudentChrome={role === "student"}
              simulation={role === "student" ? simulation : null}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </>
      )}

      <div
        className={`flex min-h-screen min-w-0 flex-col ${desktopCollapsed ? "" : "lg:pl-[240px]"}`}
      >
        <PortalTopBar
          displayName={displayName}
          roleLabel={roleBadge(role)}
          contextTitle={contextTitle}
          contextMeta={contextMeta}
          mobileOpen={mobileOpen || !desktopCollapsed}
          onToggleMobile={toggleNav}
          homeHref={homeHref}
          helpHref={role === "student" ? "/help" : "/about"}
          showBrandInBar={role === "student"}
        />
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export function PortalShell({
  role,
  children,
}: {
  role: PortalRole;
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#eef0f3] text-sm text-[#6b7280]">
          Loading portal…
        </div>
      }
    >
      <PortalShellInner role={role}>{children}</PortalShellInner>
    </Suspense>
  );
}
