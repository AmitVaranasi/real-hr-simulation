import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function RegisterPage() {
  const configured = isSupabaseConfigured();

  return (
    <div className="mx-auto w-full min-w-0 max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold text-slate-900">Register</h1>
      <p className="mt-2 text-slate-600">
        Create a student or instructor account.
      </p>
      {!configured ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Configure Supabase in <code className="text-xs">.env.local</code> to
          enable registration.
        </div>
      ) : (
        <RegisterForm />
      )}
      <p className="mt-6 text-sm">
        <Link href="/login" className="text-[#e67e22] hover:underline">
          Already have an account? Login
        </Link>
      </p>
    </div>
  );
}
