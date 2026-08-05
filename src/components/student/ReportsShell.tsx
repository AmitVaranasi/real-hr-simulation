import Link from "next/link";
import { redirect } from "next/navigation";
import { ReportsSubnav } from "@/components/student/ReportsSubnav";
import { StudentPageHeader } from "@/components/student/shell/StudentShell";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

export async function ReportsRoundList() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/reports");

  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id, teams(id, name, session_id)")
    .eq("user_id", user.id)
    .maybeSingle();

  const team = membership?.teams as unknown as {
    id: string;
    name: string;
    session_id: string;
  } | null;

  if (!team) {
    return (
      <p className="text-sm text-[#6b7280]">
        Join a team to view reports.{" "}
        <Link href="/join" className="text-[#e67e22] hover:underline">
          Join Session →
        </Link>
      </p>
    );
  }

  const { data: outcomes } = await supabase
    .from("outcomes")
    .select(
      "id, round_id, total_score, revenue, stock_price, rounds(round_number, status)"
    )
    .eq("team_id", team.id)
    .order("computed_at", { ascending: false });

  return (
    <aside className="rounded-xl border border-[#dde1e6] bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-[#e67e22]">
        The Workforce Brief
      </p>
      <p className="mt-1 text-xs text-[#6b7280]">
        Select a round to review results
      </p>
      <ul className="mt-3 space-y-2">
        {(outcomes ?? []).length === 0 ? (
          <li className="text-sm text-[#6b7280]">
            No finalized rounds yet. Results appear after the instructor closes a
            round.
          </li>
        ) : (
          outcomes?.map((o) => {
            const round = o.rounds as unknown as {
              round_number: number;
              status: string;
            } | null;
            return (
              <li key={o.id}>
                <Link
                  href={`/round/${o.round_id}/results`}
                  className="block rounded-lg border border-[#f0f1f3] bg-[#f8f9fb] px-3 py-2 text-sm hover:border-[#e67e22]"
                >
                  <span className="font-semibold text-[#0f172a]">
                    Round {round?.round_number ?? "—"} Results
                  </span>
                  <span className="mt-1 block text-xs text-[#6b7280]">
                    BSC {Number(o.total_score).toFixed(1)} · Rev{" "}
                    {formatCurrency(Number(o.revenue))} · Stock $
                    {Number(o.stock_price).toFixed(2)}
                  </span>
                </Link>
              </li>
            );
          })
        )}
      </ul>
    </aside>
  );
}

export function ReportsShell({
  title,
  subtitle,
  activeHref,
  children,
}: {
  title: string;
  subtitle: string;
  activeHref: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <StudentPageHeader title={title} subtitle={subtitle} />
      <ReportsSubnav activeHref={activeHref} />
      {children}
    </div>
  );
}
