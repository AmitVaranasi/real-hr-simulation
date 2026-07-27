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
        className="text-sm text-[#e67e22] hover:underline"
      >
        ← Session
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Class reports</h1>
      <p className="text-slate-600">
        Compare teams, track participation, and export data.
      </p>
      <div className="mt-8">
        <ReportsClient sessionId={sessionId} />
      </div>
    </div>
  );
}
