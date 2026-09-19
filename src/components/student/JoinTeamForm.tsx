"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { formInputClassName } from "@/components/ui/form-controls";
import { useTranslation } from "@/lib/i18n/LocaleProvider";

type TeamPreview = {
  name: string;
  industry: string;
  strategy: string;
  sessions: { name: string };
};

function normalizeCode(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, "");
}

export function JoinTeamForm({
  initialCode = "",
  allowSwitch = false,
}: {
  initialCode?: string;
  allowSwitch?: boolean;
}) {
  const router = useRouter();
  const t = useTranslation();
  const [code, setCode] = useState(initialCode);
  /**
   * Preview result tagged with the code it describes. Reading it back through
   * a code match means a stale response can never be shown against a newer
   * code — previously the team from a half-typed code stayed on screen until
   * the next fetch resolved.
   */
  const [preview, setPreview] = useState<{
    code: string;
    team: TeamPreview | null;
    error: string | null;
  } | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinLoading, setJoinLoading] = useState(false);

  const normalized = normalizeCode(code);
  const tooShort = normalized.length < 4;

  // Adopt a changed initialCode during render rather than in an effect, so the
  // input never paints one frame with the previous code.
  const [seenInitialCode, setSeenInitialCode] = useState(initialCode);
  if (initialCode !== seenInitialCode) {
    setSeenInitialCode(initialCode);
    setCode(initialCode);
  }

  const current = preview?.code === normalized ? preview : null;
  const team = current?.team ?? null;
  const previewError = current?.error ?? null;
  const previewLoading = !tooShort && current === null;

  useEffect(() => {
    if (tooShort) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/teams/preview?code=${encodeURIComponent(normalized)}`,
          { signal: controller.signal }
        );
        if (!res.ok) {
          setPreview({
            code: normalized,
            team: null,
            error: t("student", "joinForm.notFound"),
          });
          return;
        }
        const data = await res.json();
        setPreview({ code: normalized, team: data.team, error: null });
      } catch {
        if (!controller.signal.aborted) {
          setPreview({
            code: normalized,
            team: null,
            error: t("student", "joinForm.lookupFailed"),
          });
        }
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // t is a stable function for the lifetime of the active locale (see
    // LocaleProvider), and including it here would re-run the lookup on
    // every render without changing behavior.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalized, tooShort]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!normalized) {
      setJoinError(t("student", "joinForm.codeRequired"));
      return;
    }

    setJoinLoading(true);
    setJoinError(null);
    const res = await fetch("/api/teams/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ join_code: normalized }),
    });
    const data = await res.json();
    if (!res.ok) {
      setJoinError(data.error ?? t("student", "joinForm.joinFailed"));
      setJoinLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleJoin} className="mt-6 space-y-4">
      {allowSwitch && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          {t("student", "joinForm.switchWarning")}
        </p>
      )}
      <label className="block text-sm">
        <span className="font-medium text-[var(--portal-ink)]">
          {t("student", "joinForm.codeLabel")}
        </span>
        <input
          type="text"
          autoComplete="off"
          spellCheck={false}
          placeholder={t("student", "joinForm.codePlaceholder")}
          className={`mt-1 font-mono ${formInputClassName}`}
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <span className="mt-1 block text-xs text-[var(--portal-muted)]">
          {t("student", "joinForm.codeHint")}
        </span>
      </label>

      {previewLoading && (
        <p className="text-sm text-[var(--portal-muted)]">
          {t("student", "joinForm.lookingUp")}
        </p>
      )}

      {previewError && !previewLoading && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {previewError}
        </p>
      )}

      {joinError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {joinError}
        </p>
      )}

      {team && !previewLoading && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">
            {t("student", "joinForm.teamFound")}
          </p>
          <p className="mt-1 font-medium text-[var(--portal-ink)]">{team.name}</p>
          <p className="text-sm text-[var(--portal-muted)]">
            {team.sessions?.name ?? t("student", "joinForm.fallbackSession")}
          </p>
          <p className="mt-1 text-sm text-[var(--portal-muted)]">
            {team.industry} · {team.strategy}
          </p>
        </div>
      )}

      <Button
        type="submit"
        className="w-full bg-[var(--portal-primary)] text-white hover:bg-[var(--portal-primary-hover)]"
        disabled={joinLoading || !normalized || previewLoading || !team}
      >
        {joinLoading
          ? t("student", "joinForm.joining")
          : allowSwitch
            ? t("student", "joinForm.switchCta")
            : t("student", "joinForm.joinCta")}
      </Button>
    </form>
  );
}
