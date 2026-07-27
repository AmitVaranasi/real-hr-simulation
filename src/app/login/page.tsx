import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function LoginPage() {
  const configured = isSupabaseConfigured();

  return (
    <div className="mx-auto w-full min-w-0 max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold text-slate-900">Login</h1>
      <p className="mt-2 text-slate-600">
        Sign in as an instructor or student.
      </p>
      {!configured ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">Supabase not configured</p>
          <p className="mt-1">
            Copy <code className="text-xs">.env.example</code> to{" "}
            <code className="text-xs">.env.local</code> and add your project
            credentials. You can still use the{" "}
            <Link href="/simulate" className="underline">
              offline simulator
            </Link>
            .
          </p>
        </div>
      ) : (
        <Suspense fallback={<p className="mt-6 text-sm text-slate-500">Loading…</p>}>
          <LoginForm />
        </Suspense>
      )}
      <p className="mt-6 text-sm text-slate-500">
        No account?{" "}
        <Link href="/register" className="font-medium text-[#e67e22] hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}
