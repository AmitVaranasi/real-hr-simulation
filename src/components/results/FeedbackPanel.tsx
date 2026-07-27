import type { FeedbackPayload } from "@/lib/engine/types";

export function FeedbackPanel({ feedback }: { feedback: FeedbackPayload }) {
  return (
    <div className="space-y-6">
      {feedback.round_summary && (
        <section className="rounded-xl border border-[#f5d0a9] bg-[#fff4e8] p-4">
          <h3 className="font-semibold text-[#9a3412]">Round summary</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            {feedback.round_summary}
          </p>
        </section>
      )}
      <section>
        <h3 className="mb-3 font-semibold text-slate-900">Perspective summaries</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {feedback.perspectives.map((p) => (
            <div
              key={p.perspective}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <div className="flex justify-between">
                <span className="font-medium">{p.display_name}</span>
                <span className="text-[#e67e22]">
                  {p.score.toFixed(1)} / {p.max_score}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{p.summary}</p>
              <p className="mt-2 text-xs text-emerald-700">{p.top_strength}</p>
              <p className="mt-1 text-xs text-amber-700">{p.top_weakness}</p>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h3 className="mb-3 font-semibold text-slate-900">Metric feedback</h3>
        <ul className="space-y-3">
          {feedback.metrics.map((m) => (
            <li
              key={m.metric_name}
              className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm"
            >
              <span className="font-medium">{m.display_name}</span>
              <span className="ml-2 text-slate-500">({m.formatted_value})</span>
              <p className="mt-1 text-slate-600">{m.feedback_text}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
