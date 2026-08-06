"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formInputClassName } from "@/components/ui/form-controls";

export function ResetStudentPasswordForm({
  sessionId,
}: {
  sessionId: string;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    const res = await fetch("/api/auth/reset-student", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, sessionId }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to send reset");
      return;
    }
    setMessage("Password reset email sent.");
    setEmail("");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3">
      <p className="text-sm text-[var(--portal-muted)]">
        Send a password reset email to a student enrolled in this session.
      </p>
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}
      {message && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {message}
        </p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="block min-w-0 flex-1 text-sm">
          <span className="font-medium text-[var(--portal-ink)]">Student email</span>
          <input
            type="email"
            required
            className={`mt-1 ${formInputClassName}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? "Sending…" : "Send reset"}
        </Button>
      </div>
    </form>
  );
}
