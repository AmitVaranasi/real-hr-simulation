export function ReflectionDisplay({
  content,
  submittedAt,
}: {
  content: string;
  submittedAt: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h3 className="font-semibold text-slate-900">Team reflection</h3>
      <p className="text-xs text-slate-500">
        Submitted {new Date(submittedAt).toLocaleString()}
      </p>
      <p className="mt-4 whitespace-pre-wrap text-sm text-slate-700">{content}</p>
    </div>
  );
}
