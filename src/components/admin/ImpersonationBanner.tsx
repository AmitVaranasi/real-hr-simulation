"use client";

import { useEffect, useState } from "react";

export function ImpersonationBanner() {
  const [active, setActive] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const res = await fetch("/api/admin/impersonate", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setActive(!!data.impersonating);
      } catch {
        /* ignore */
      }
    }
    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!active) return null;

  async function exit() {
    setExiting(true);
    try {
      const res = await fetch("/api/admin/impersonate/exit", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Could not exit impersonation");
        setExiting(false);
        return;
      }
      window.location.href = data.home ?? "/admin";
    } catch {
      alert("Could not exit impersonation");
      setExiting(false);
    }
  }

  return (
    <div className="sticky top-0 z-[60] border-b border-amber-300 bg-amber-100 px-4 py-2 text-sm text-amber-950">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
        <p>
          <span className="font-semibold">Impersonation active</span> — you are
          viewing the app as another user. Actions are attributed in the audit
          log.
        </p>
        <button
          type="button"
          disabled={exiting}
          onClick={() => void exit()}
          className="rounded border border-amber-400 bg-white px-3 py-1 text-xs font-semibold hover:bg-amber-50 disabled:opacity-60"
        >
          {exiting ? "Exiting…" : "Exit to admin"}
        </button>
      </div>
    </div>
  );
}
