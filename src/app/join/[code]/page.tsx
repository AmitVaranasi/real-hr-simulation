"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function JoinTeamPage() {
  const params = useParams();
  const code = params.code as string;
  const router = useRouter();
  const [team, setTeam] = useState<{
    name: string;
    industry: string;
    strategy: string;
    sessions: { name: string };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/teams/preview?code=${encodeURIComponent(code)}`);
      if (res.ok) {
        const data = await res.json();
        setTeam(data.team);
      }
    }
    void load();
  }, [code]);

  async function handleJoin() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/teams/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ join_code: code }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not join team");
      setLoading(false);
      return;
    }
    setTeam(data.team);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold text-slate-900">Join team</h1>
      <p className="mt-2 text-slate-600">
        Join code: <span className="font-mono">{code}</span>
      </p>
      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}
      {team && (
        <div className="mt-4 rounded-lg border border-slate-200 p-4">
          <p className="font-medium">{team.name}</p>
          <p className="text-sm text-slate-500">
            {team.industry} · {team.strategy}
          </p>
        </div>
      )}
      <Button className="mt-6 w-full" onClick={handleJoin} disabled={loading}>
        {loading ? "Joining…" : "Join this team"}
      </Button>
    </div>
  );
}
