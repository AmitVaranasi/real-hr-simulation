import type { FeedbackPayload } from "@/lib/engine/types";

export function LearningInsightsPanel({
  insights,
}: {
  insights: NonNullable<FeedbackPayload["learning_insights"]>;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
        <h3 className="font-semibold text-emerald-900">What went well</h3>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-[var(--portal-ink)]">
          {insights.went_well.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
        <h3 className="font-semibold text-amber-900">What hurt performance</h3>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-[var(--portal-ink)]">
          {insights.hurt_performance.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <section className="rounded-xl border border-[var(--portal-primary)]/30 bg-[var(--portal-primary-soft)]/70 p-4">
        <h3 className="font-semibold text-[var(--portal-title)]">Next round</h3>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-[var(--portal-ink)]">
          {insights.next_round.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      {insights.causal_factors.length > 0 && (
        <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 lg:col-span-3">
          <h3 className="font-semibold text-[var(--portal-title)]">Why these outcomes happened</h3>
          <ul className="mt-2 space-y-1 text-sm text-[var(--portal-muted)]">
            {insights.causal_factors.map((item) => (
              <li key={item}>→ {item}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
