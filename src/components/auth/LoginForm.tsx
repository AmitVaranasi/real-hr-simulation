"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { formInputClassName } from "@/components/ui/form-controls";

function safeRedirectPath(next: string | null): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

function friendlyAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("failed to fetch") || lower.includes("network")) {
    return "Could not reach the auth service. Check your connection, disable strict blockers for this site, and try again.";
  }
  if (lower.includes("invalid login") || lower.includes("invalid credentials")) {
    return "Invalid email or password.";
  }
  if (lower.includes("email not confirmed")) {
    return "Please confirm your email before signing in.";
  }
  return message;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeRedirectPath(searchParams.get("next"));
  const authError = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    authError === "auth"
      ? "Sign-in link expired or failed. Try again or request a password reset."
      : null
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError(friendlyAuthError(signInError.message));
        setLoading(false);
        return;
      }
      // Promote ADMIN_EMAILS allowlist and resolve effective role server-side.
      const meRes = await fetch("/api/auth/me", { cache: "no-store" });
      const me = meRes.ok ? await meRes.json() : null;
      const role = me?.role as string | null | undefined;
      const defaultPath =
        role === "admin"
          ? "/admin"
          : role === "instructor"
            ? "/sessions"
            : "/dashboard/getting-started";
      // Avoid sending admins to student/instructor deep-links after promote.
      const dest =
        role === "admin" && nextPath && !nextPath.startsWith("/admin")
          ? "/admin"
          : (nextPath ?? defaultPath);
      router.push(dest);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign-in failed";
      setError(friendlyAuthError(msg));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}
      <label className="block text-sm">
        <span className="font-medium text-slate-700">Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          className={`mt-1 ${formInputClassName}`}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium text-slate-700">Password</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          className={`mt-1 ${formInputClassName}`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-[#e67e22] hover:underline"
        >
          Forgot password?
        </Link>
      </div>
      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-[#e67e22] text-white hover:bg-[#d35400]"
      >
        {loading ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
