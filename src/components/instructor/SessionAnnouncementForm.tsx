"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formInputClassName } from "@/components/ui/form-controls";

export function SessionAnnouncementForm({
  sessionId,
  initialAnnouncement,
}: {
  sessionId: string;
  initialAnnouncement: string | null;
}) {
  const router = useRouter();
  const [text, setText] = useState(initialAnnouncement ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          announcement: text.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errText = data.error ?? "Failed to save";
        // Common when migration-v4.sql has not been applied yet
        if (
          typeof errText === "string" &&
          errText.toLowerCase().includes("announcement")
        ) {
          setMessage(
            "Could not save announcement. Run supabase/migration-v4.sql in the Supabase SQL editor, then try again."
          );
        } else {
          setMessage(errText);
        }
        return;
      }
      setMessage("Announcement saved — students see it on their dashboard.");
      router.refresh();
    } catch {
      setMessage(
        "Could not reach the server. Confirm the app is running at http://127.0.0.1:3000 and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3">
      <label className="block text-sm">
        <span className="font-medium text-[var(--portal-ink)]">
          Announcement (shown on student dashboard)
        </span>
        <textarea
          rows={3}
          className={`mt-1 ${formInputClassName}`}
          placeholder="e.g. Round 2 opens Friday — submit by Sunday 11:59pm."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? "Saving…" : "Save announcement"}
        </Button>
        {message && <p className="text-sm text-[var(--portal-muted)]">{message}</p>}
      </div>
    </form>
  );
}
