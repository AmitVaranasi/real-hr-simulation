import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function ForgotPasswordPage() {
  const configured = isSupabaseConfigured();

  return (
    <div className="mx-auto w-full min-w-0 max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold text-slate-900">Reset password</h1>
      <p className="mt-2 text-slate-600">
        Enter your account email and we will send a reset link.
      </p>
      {!configured ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">Supabase not configured</p>
          <p className="mt-1">
            Add credentials to <code className="text-xs">.env.local</code> first.
          </p>
        </div>
      ) : (
        <ForgotPasswordForm />
      )}
      <p className="mt-6 text-sm text-slate-500">
        Remembered your password?{" "}
        <Link href="/login" className="text-indigo-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
