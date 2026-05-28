import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export default async function SessionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("instructor_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Your sessions</h1>
          <p className="text-slate-600">Manage course simulations</p>
        </div>
        <Link href="/sessions/new">
          <Button>New session</Button>
        </Link>
      </div>
      <div className="space-y-3">
        {(sessions ?? []).length === 0 && (
          <p className="text-slate-500">
            No sessions yet. Create one to add teams and open rounds.
          </p>
        )}
        {(sessions ?? []).map((s) => (
          <Link
            key={s.id}
            href={`/sessions/${s.id}`}
            className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="font-semibold text-slate-900">{s.name}</p>
            <p className="text-sm text-slate-500">
              {s.course_code && `${s.course_code} · `}
              {s.semester && `${s.semester} · `}
              Status: {s.status}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
