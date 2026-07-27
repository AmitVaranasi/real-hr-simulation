import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function ResetPasswordPage() {
  const configured = isSupabaseConfigured();

  return (
    <div className="mx-auto w-full min-w-0 max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold text-slate-900">Choose a new password</h1>
      <p className="mt-2 text-slate-600">
        Enter a new password for your account. You will stay signed in after
        updating.
      </p>
      {!configured ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Supabase is not configured.
        </div>
      ) : (
        <ResetPasswordForm />
      )}
      <p className="mt-6 text-sm text-slate-500">
        Link expired?{" "}
        <Link href="/forgot-password" className="text-[#e67e22] hover:underline">
          Request a new reset email
        </Link>
      </p>
    </div>
  );
}
