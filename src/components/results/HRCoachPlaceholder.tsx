export function HRCoachPlaceholder() {
  const prompts = [
    "Ask the HR Coach",
    "Why did my score change?",
    "What should I consider next round?",
  ];

  return (
    <section className="rounded-xl border border-dashed border-[var(--portal-sidebar-border)] bg-[var(--portal-page)] p-5">
      <h3 className="font-semibold text-slate-800">HR Coach (coming soon)</h3>
      <p className="mt-1 text-sm text-[var(--portal-muted)]">
        Future versions will connect to an AI coach for personalized guidance.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {prompts.map((label) => (
          <button
            key={label}
            type="button"
            disabled
            className="cursor-not-allowed rounded-lg border border-[var(--portal-sidebar-border)] bg-white px-3 py-2 text-sm text-[var(--portal-muted)]"
            title="Available in a future release"
          >
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}
