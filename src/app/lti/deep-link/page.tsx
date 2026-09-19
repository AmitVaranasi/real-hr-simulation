"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface SessionSummary {
  id: string;
  name: string;
  status: string;
}

/**
 * Deep-linking placement page: reached after Canvas launches this tool from
 * an assignment's "External Tool" picker. The instructor chooses which of
 * their own simulation sessions to place; submitting POSTs to
 * /api/lti/deep-link, which returns a signed LtiDeepLinkingResponse this
 * page then auto-submits back to Canvas via the platform's own
 * deep_link_return_url.
 */
export default function DeepLinkPage() {
  const [sessions, setSessions] = useState<SessionSummary[] | null>(null);
  const [selected, setSelected] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formTarget, setFormTarget] = useState<{ returnUrl: string; jwt: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/sessions")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setSessions(data.sessions ?? []);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load your sessions.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = useCallback(async () => {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/lti/deep-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: selected }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to complete placement.");
        setSubmitting(false);
        return;
      }
      setFormTarget({ returnUrl: data.returnUrl, jwt: data.jwt });
    } catch {
      setError("Failed to complete placement.");
      setSubmitting(false);
    }
  }, [selected]);

  if (formTarget) {
    // Auto-submitting form back to Canvas's deep_link_return_url.
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-[var(--portal-ink)]">Returning to Canvas…</p>
        <form method="POST" action={formTarget.returnUrl} id="dl-return-form">
          <input type="hidden" name="JWT" value={formTarget.jwt} />
        </form>
        <script
          dangerouslySetInnerHTML={{
            __html: "document.getElementById('dl-return-form').submit();",
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg py-16">
      <h1 className="text-lg font-semibold text-[var(--portal-ink)]">
        Place a simulation session
      </h1>
      <p className="mt-2 text-sm text-[var(--portal-ink)]/70">
        Choose which of your simulation sessions this Canvas assignment should open.
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {sessions === null ? (
        <p className="mt-6 text-sm text-[var(--portal-ink)]/60">Loading your sessions…</p>
      ) : sessions.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--portal-ink)]/60">
          You have no sessions yet. Create one first, then return here.
        </p>
      ) : (
        <div className="mt-6 space-y-2">
          {sessions.map((s) => (
            <label
              key={s.id}
              className="flex items-center gap-3 rounded-md border border-[var(--portal-sidebar-border)] p-3 text-sm"
            >
              <input
                type="radio"
                name="session"
                value={s.id}
                checked={selected === s.id}
                onChange={() => setSelected(s.id)}
              />
              <span>{s.name}</span>
              <span className="ml-auto text-xs text-[var(--portal-ink)]/50">{s.status}</span>
            </label>
          ))}
        </div>
      )}

      <Button
        variant="orange"
        className="mt-6"
        disabled={!selected || submitting}
        onClick={submit}
      >
        {submitting ? "Placing…" : "Place in Canvas"}
      </Button>
    </div>
  );
}
