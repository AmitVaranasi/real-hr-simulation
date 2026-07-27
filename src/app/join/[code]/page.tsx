import { JoinTeamForm } from "@/components/student/JoinTeamForm";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function JoinTeamByCodePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/join/${encodeURIComponent(code)}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "admin") {
    redirect("/admin");
  }
  if (profile?.role === "instructor") {
    redirect("/sessions");
  }

  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id, teams(name)")
    .eq("user_id", user.id)
    .maybeSingle();

  const currentName = (
    membership?.teams as unknown as { name: string } | null
  )?.name;

  return (
    <div className="mx-auto w-full min-w-0 max-w-md px-4 py-12 sm:py-16">
      <h1 className="text-2xl font-bold text-[#1f2937]">
        {currentName ? "Switch to this team" : "Join your team"}
      </h1>
      <p className="mt-2 text-sm text-[#6b7280]">
        Confirm the team below, or edit the code if needed.
        {currentName
          ? ` You are currently on ${currentName}; joining will switch sessions.`
          : ""}
      </p>
      <JoinTeamForm initialCode={code} allowSwitch={!!membership} />
      <p className="mt-8 text-center text-sm">
        <Link href="/dashboard" className="font-medium text-[#e67e22] hover:underline">
          Back to dashboard
        </Link>
      </p>
    </div>
  );
}
