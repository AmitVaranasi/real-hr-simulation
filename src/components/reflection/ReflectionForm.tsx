"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ReflectionFormProps {
  teamId: string;
  roundId: string;
}

export function ReflectionForm({ teamId, roundId }: ReflectionFormProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (content.length < 100) {
      toast.error("Reflection must be at least 100 characters");
      return;
    }
    if (content.length > 2000) {
      toast.error("Reflection must be under 2000 characters");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/reflections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team_id: teamId, round_id: roundId, content }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Failed to submit");
      return;
    }
    toast.success("Reflection submitted");
    window.location.reload();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6">
      <h3 className="font-semibold text-slate-900">Team reflection</h3>
      <p className="mt-1 text-sm text-slate-500">
        100–2000 characters. Explain your HR decisions and what you learned.
      </p>
      <textarea
        className="mt-4 w-full rounded-lg border border-slate-300 p-3 text-sm"
        rows={6}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Our team focused on..."
      />
      <p className="mt-1 text-xs text-slate-400">{content.length} / 2000</p>
      <Button type="submit" className="mt-4" disabled={loading}>
        {loading ? "Submitting…" : "Submit reflection"}
      </Button>
    </form>
  );
}
