"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { formInputClassName } from "@/components/ui/form-controls";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) {
        setError(
          updateError.message.includes("session")
            ? "This reset link is invalid or expired. Request a new one."
            : updateError.message
        );
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "")
        .single();

      router.push(
        profile?.role === "admin"
          ? "/admin"
          : profile?.role === "instructor"
            ? "/sessions"
            : "/dashboard"
      );
      router.refresh();
    } catch {
      setError(
        "Could not update password. Check your connection and try again."
      );
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
        <span className="font-medium text-slate-700">New password</span>
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={`mt-1 ${formInputClassName}`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium text-slate-700">Confirm password</span>
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={`mt-1 ${formInputClassName}`}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </label>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
