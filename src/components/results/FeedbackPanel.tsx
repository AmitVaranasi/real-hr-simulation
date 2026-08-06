import type { FeedbackPayload } from "@/lib/engine/types";

export function FeedbackPanel({ feedback }: { feedback: FeedbackPayload }) {
  return (
    <div className="space-y-6">
      {feedback.round_summary && (
        <section className="rounded-xl border border-[var(--portal-primary)]/30 bg-[var(--portal-primary-soft)] p-4">
          <h3 className="font-semibold text-[var(--portal-title)]">Round summary</h3>
          <p className="mt-2 text-sm leading-relaxed text-[var(--portal-ink)]">
            {feedback.round_summary}
          </p>
        </section>
      )}
      <section>
        <h3 className="mb-3 font-semibold text-[var(--portal-title)]">Perspective summaries</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {feedback.perspectives.map((p) => (
            <div
              key={p.perspective}
              className="rounded-lg border border-[var(--portal-sidebar-border)] bg-white p-4"
            >
              <div className="flex justify-between">
                <span className="font-medium">{p.display_name}</span>
                <span className="text-[var(--portal-primary)]">
                  {p.score.toFixed(1)} / {p.max_score}
                </span>
              </div>
              <p className="mt-2 text-sm text-[var(--portal-muted)]">{p.summary}</p>
              <p className="mt-2 text-xs text-emerald-700">{p.top_strength}</p>
              <p className="mt-1 text-xs text-amber-700">{p.top_weakness}</p>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h3 className="mb-3 font-semibold text-[var(--portal-title)]">Metric feedback</h3>
        <ul className="space-y-3">
          {feedback.metrics.map((m) => (
            <li
              key={m.metric_name}
              className="rounded-lg border border-[var(--portal-sidebar-border)] bg-[var(--portal-page)] p-3 text-sm"
            >
              <span className="font-medium">{m.display_name}</span>
              <span className="ml-2 text-[var(--portal-muted)]">({m.formatted_value})</span>
              <p className="mt-1 text-[var(--portal-muted)]">{m.feedback_text}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
