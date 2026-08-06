"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { formInputClassName } from "@/components/ui/form-controls";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const supabase = createClient();
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${origin}/auth/callback?next=/auth/reset-password`,
        }
      );
      if (resetError) {
        setError(
          resetError.message.includes("fetch")
            ? "Could not reach the auth service. Check your connection and try again."
            : resetError.message
        );
        setLoading(false);
        return;
      }
      setSuccess(true);
    } catch {
      setError(
        "Could not reach the auth service. Check your connection and try again."
      );
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="mt-6 space-y-4">
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          If an account exists for that email, a reset link has been sent. Check
          your inbox and spam folder.
        </p>
        <Link
          href="/login"
          className="inline-block text-sm text-[var(--portal-primary)] hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}
      <label className="block text-sm">
        <span className="font-medium text-[var(--portal-ink)]">Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          className={`mt-1 ${formInputClassName}`}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Sending…" : "Send reset link"}
      </Button>
      <p className="text-center text-sm text-[var(--portal-muted)]">
        <Link href="/login" className="text-[var(--portal-primary)] hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
