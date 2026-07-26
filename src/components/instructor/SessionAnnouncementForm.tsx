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
    const res = await fetch(`/api/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        announcement: text.trim() || null,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error ?? "Failed to save");
      return;
    }
    setMessage("Announcement saved — students see it on their dashboard.");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3">
      <label className="block text-sm">
        <span className="font-medium text-slate-700">
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
        {message && <p className="text-sm text-slate-600">{message}</p>}
      </div>
    </form>
  );
}
