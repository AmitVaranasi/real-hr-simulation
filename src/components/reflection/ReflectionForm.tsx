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
    <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-6">
      <h3 className="font-semibold text-[var(--portal-title)]">Team reflection</h3>
      <p className="mt-1 text-sm text-[var(--portal-muted)]">
        100–2000 characters. Explain your HR decisions and what you learned.
      </p>
      <textarea
        className="mt-4 w-full min-w-0 rounded-lg border border-[var(--portal-sidebar-border)] bg-white p-3 text-sm text-[var(--portal-title)] [color-scheme:light]"
        rows={6}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Our team focused on..."
      />
      <p className="mt-1 text-xs text-[var(--portal-muted)]">{content.length} / 2000</p>
      <Button type="submit" className="mt-4" disabled={loading}>
        {loading ? "Submitting…" : "Submit reflection"}
      </Button>
    </form>
  );
}
