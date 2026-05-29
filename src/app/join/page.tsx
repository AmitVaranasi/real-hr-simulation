import Link from "next/link";
import { JoinTeamForm } from "@/components/student/JoinTeamForm";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function JoinPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/join");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "instructor") {
    redirect("/sessions");
  }

  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (membership) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-md px-4 py-12 sm:py-16">
      <h1 className="text-2xl font-bold text-slate-900">Join your team</h1>
      <p className="mt-2 text-slate-600">
        Enter the join code your instructor gave you. You only need to do this
        once for the class.
      </p>
      <JoinTeamForm />
      <p className="mt-8 text-center text-sm text-slate-500">
        Already on a team?{" "}
        <Link href="/dashboard" className="text-indigo-600 hover:underline">
          Go to dashboard
        </Link>
      </p>
    </div>
  );
}
