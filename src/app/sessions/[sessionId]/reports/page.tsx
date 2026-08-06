import { ReportsClient } from "@/components/instructor/ReportsClient";
import Link from "next/link";

export default async function SessionReportsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link
        href={`/sessions/${sessionId}`}
        className="text-sm text-[var(--portal-primary)] hover:underline"
      >
        ← Session
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-[var(--portal-title)]">Class reports</h1>
      <p className="text-[var(--portal-muted)]">
        Compare teams, track participation, and export data.
      </p>
      <div className="mt-8">
        <ReportsClient sessionId={sessionId} />
      </div>
    </div>
  );
}
