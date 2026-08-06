"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ProfessorRoleNav, StudentRoleNav } from "./RoleNav";

type Props = {
  role: "instructor" | "student" | null;
};

export function AppShellNav({ role }: Props) {
  const pathname = usePathname();
  const [openRoundId, setOpenRoundId] = useState<string | null>(null);

  useEffect(() => {
    if (role !== "student") return;
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/student/dashboard", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setOpenRoundId(data.openRound?.id ?? null);
      } catch {
        /* ignore */
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [role, pathname]);

  if (!role) return null;

  // Extract sessionId from /sessions/[sessionId]/...
  const sessionMatch = pathname.match(
    /^\/sessions\/([0-9a-f-]{36})(?:\/|$)/i
  );
  const sessionId = sessionMatch?.[1] ?? null;

  const showStudent =
    role === "student" &&
    (pathname.startsWith("/dashboard") ||
      pathname.startsWith("/round/") ||
      pathname.startsWith("/history") ||
      pathname.startsWith("/leaderboard") ||
      pathname.startsWith("/join"));

  const showProfessor =
    role === "instructor" && pathname.startsWith("/sessions");

  if (!showStudent && !showProfessor) return null;

  return (
    <div className="border-b border-[var(--portal-sidebar-border)] bg-[var(--portal-page)]">
      <div className="mx-auto w-full max-w-6xl px-4 py-2.5">
        {showStudent && <StudentRoleNav openRoundId={openRoundId} />}
        {showProfessor && <ProfessorRoleNav sessionId={sessionId} />}
      </div>
    </div>
  );
}
