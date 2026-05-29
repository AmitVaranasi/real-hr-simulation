"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type OpenRound = {
  id: string;
  round_number: number;
  round_type: string;
  status: string;
  economy_condition: string;
};

interface CurrentRoundCardProps {
  initialOpenRound: OpenRound | null;
}

export function CurrentRoundCard({ initialOpenRound }: CurrentRoundCardProps) {
  const [openRound, setOpenRound] = useState<OpenRound | null>(initialOpenRound);
  const [checking, setChecking] = useState(false);

  const fetchStatus = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/student/dashboard", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      setOpenRound(data.openRound ?? null);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    setOpenRound(initialOpenRound);
  }, [initialOpenRound]);

  useEffect(() => {
    const interval = setInterval(() => {
      void fetchStatus();
    }, 5000);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void fetchStatus();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [fetchStatus]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-semibold text-slate-900">Current round</h2>
        {checking && !openRound && (
          <span className="text-xs text-slate-400">Checking…</span>
        )}
      </div>
      {openRound ? (
        <>
          <p className="mt-2 text-sm text-emerald-700">
            Round {openRound.round_number} ({openRound.round_type}) is open ·{" "}
            {openRound.economy_condition} economy
          </p>
          <Link
            href={`/round/${openRound.id}/decisions`}
            className="mt-4 inline-block"
          >
            <Button>Make decisions →</Button>
          </Link>
        </>
      ) : (
        <>
          <p className="mt-2 text-sm text-slate-500">
            No round open yet. This page updates automatically when your
            instructor opens a round.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => void fetchStatus()}
            disabled={checking}
          >
            {checking ? "Checking…" : "Check now"}
          </Button>
        </>
      )}
    </div>
  );
}
