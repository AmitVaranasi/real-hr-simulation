"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { PortalSidebar } from "./PortalSidebar";
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
  const [displayName, setDisplayName] = useState("User");
  const [contextTitle, setContextTitle] = useState(roleHomeLabel(role));
  const [contextMeta, setContextMeta] = useState<string | null>(null);
  const [openRoundId, setOpenRoundId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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
        }

        const { data: membership } = await supabase
          .from("team_members")
          .select(
            "teams(name, industry, strategy, sessions(name, course_code))"
          )
          .eq("user_id", user.id)
          .maybeSingle();

        const team = membership?.teams as unknown as {
          name: string;
          industry: string;
          strategy: string;
          sessions: { name: string; course_code: string | null };
        } | null;

        if (team) {
          setContextTitle(`${team.name} Dashboard`);
          setContextMeta(
            [
              team.sessions?.name,
              team.sessions?.course_code,
              team.industry,
              team.strategy,
            ]
              .filter(Boolean)
              .join(" · ")
          );
        } else {
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

  return (
    <div className="min-h-screen bg-[#eef0f3]">
      {/* Fixed desktop sidebar — stays visible while content scrolls */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[240px] lg:block">
        <PortalSidebar items={items} brandSubtitle={roleHomeLabel(role)} />
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
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </>
      )}

      <div className="flex min-h-screen min-w-0 flex-col lg:pl-[240px]">
        <PortalTopBar
          displayName={displayName}
          roleLabel={roleBadge(role)}
          contextTitle={contextTitle}
          contextMeta={contextMeta}
          mobileOpen={mobileOpen}
          onToggleMobile={() => setMobileOpen((o) => !o)}
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
