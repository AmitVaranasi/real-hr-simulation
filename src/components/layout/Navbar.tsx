import Link from "next/link";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-semibold text-indigo-700">
          Real HR Simulation
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/simulate" className="text-slate-600 hover:text-slate-900">
            Simulator
          </Link>
          <Link href="/dashboard" className="text-slate-600 hover:text-slate-900">
            Dashboard
          </Link>
          <Link href="/sessions" className="text-slate-600 hover:text-slate-900">
            Sessions
          </Link>
          <Link href="/login" className="text-slate-600 hover:text-slate-900">
            Login
          </Link>
          <Link
            href="/register"
            className="inline-flex h-8 items-center rounded-lg bg-indigo-600 px-3 text-xs font-medium text-white hover:bg-indigo-700"
          >
            Register
          </Link>
          {isSupabaseConfigured() && <SignOutButton />}
        </nav>
      </div>
    </header>
  );
}
