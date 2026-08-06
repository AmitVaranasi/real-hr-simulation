export function ReflectionDisplay({
  content,
  submittedAt,
}: {
  content: string;
  submittedAt: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-6">
      <h3 className="font-semibold text-[var(--portal-title)]">Team reflection</h3>
      <p className="text-xs text-[var(--portal-muted)]">
        Submitted {new Date(submittedAt).toLocaleString()}
      </p>
      <p className="mt-4 whitespace-pre-wrap text-sm text-[var(--portal-ink)]">{content}</p>
    </div>
  );
}
