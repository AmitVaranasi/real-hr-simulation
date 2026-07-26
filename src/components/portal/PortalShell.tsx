"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { PortalSidebar } from "./PortalSidebar";
import { PortalTopBar } from "./PortalTopBar";
import {
  professorNavItems,
  studentNavItems,
  type PortalNavItem,
} from "./portal-nav";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type Role = "instructor" | "student";

function PortalShellInner({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [displayName, setDisplayName] = useState("User");
  const [contextTitle, setContextTitle] = useState(
    role === "instructor" ? "Professor Portal" : "Student Portal"
  );
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
            [
              active.course_code,
              active.semester,
              `Status: ${active.status}`,
            ]
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
    return professorNavItems({ sessionId });
  }, [role, openRoundId, sessionId]);

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Desktop sidebar */}
      <div className="hidden lg:block lg:shrink-0">
        <div className="sticky top-0 h-screen">
          <PortalSidebar
            items={items}
            brandSubtitle={
              role === "instructor" ? "Professor Portal" : "Student Portal"
            }
          />
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
            aria-label="Close sidebar"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
            <PortalSidebar
              items={items}
              brandSubtitle={
                role === "instructor" ? "Professor Portal" : "Student Portal"
              }
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <PortalTopBar
          displayName={displayName}
          roleLabel={role === "instructor" ? "Instructor" : "Student"}
          contextTitle={contextTitle}
          contextMeta={contextMeta}
          mobileOpen={mobileOpen}
          onToggleMobile={() => setMobileOpen((o) => !o)}
        />
        <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export function PortalShell({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-500">
          Loading portal…
        </div>
      }
    >
      <PortalShellInner role={role}>{children}</PortalShellInner>
    </Suspense>
  );
}
