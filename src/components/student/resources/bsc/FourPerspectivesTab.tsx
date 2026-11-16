import { Puzzle, Target } from "lucide-react";
import {
  PERSPECTIVES,
  perspectiveById,
  scoredMetricsFor,
  sharedScoredMetrics,
} from "@/lib/student/bsc-reference";
import {
  Callout,
  KeyTakeaway,
  PERSPECTIVE_STYLE,
  Panel,
  PerspectiveDonut,
  SectionTitle,
} from "@/components/student/resources/bsc/BscParts";

export function FourPerspectivesTab() {
  const shared = sharedScoredMetrics();
  return (
    <>
      <SectionTitle
        title="The Four BSC Perspectives"
        subtitle="The HR Balance Scorecard evaluates your performance across four complementary perspectives. Each one gives a different view of how your HR decisions create value for the organization."
      />

      <div className="space-y-3">
        {PERSPECTIVES.map((p) => {
          const s = PERSPECTIVE_STYLE[p.id];
          const Icon = s.icon;
          return (
            <article
              key={p.id}
              className={`grid gap-4 rounded-xl border p-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1.1fr_1.4fr] ${s.border} ${s.soft}`}
            >
              <div className="flex items-start gap-2.5">
                <Icon className={`mt-0.5 h-7 w-7 shrink-0 ${s.text}`} aria-hidden />
                <div>
                  <h3 className={`text-lg font-bold ${s.text}`}>{p.title}</h3>
                  <p className="text-sm text-[var(--portal-ink)]">{p.short}</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-[var(--portal-ink)]">{p.concept}</p>
              <div className="rounded-lg bg-white/80 p-3">
                <p className="text-xs font-bold text-[var(--portal-title)]">Scored metrics</p>
                <ul className="mt-1.5 space-y-0.5 text-sm text-[var(--portal-ink)]">
                  {scoredMetricsFor(p.id).map((m) => (
                    <li key={m.id} className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.dot}`} />
                      {m.name}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg bg-white p-3">
                <p className="flex items-center gap-1.5 text-sm font-bold text-[var(--portal-title)]">
                  <Target className={`h-4 w-4 ${s.text}`} aria-hidden />
                  What It Means in the Simulation
                </p>
                <p className="mt-1 text-sm leading-relaxed text-[var(--portal-ink)]">
                  {p.meaning}
                </p>
              </div>
            </article>
          );
        })}
      </div>

      {shared.length ? (
        <p className="text-sm leading-relaxed text-[var(--portal-muted)]">
          Some outcomes count in more than one perspective:{" "}
          {shared
            .map(
              (m) =>
                `${m.name} (${m.perspectives
                  .map((id) => perspectiveById(id).title)
                  .join(" and ")})`
            )
            .join("; ")}
          . A change in one of these moves both perspective scores.
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel>
          <SectionTitle icon={Puzzle} title="Putting It All Together" />
          <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row">
            <PerspectiveDonut label="HR Balance Scorecard" />
            <div className="space-y-2 text-sm leading-relaxed text-[var(--portal-ink)]">
              <p>
                Each perspective tells part of the organization&apos;s performance
                story. Together, they help you evaluate whether your HR decisions
                are financially responsible, supportive of employees,
                operationally effective, and sustainable over time.
              </p>
              <p>
                Strong results in one area can support, or be offset by, results
                in another. The goal is not to maximize a single metric, but to
                make strategic HR decisions that create value across all four
                perspectives.
              </p>
            </div>
          </div>
        </Panel>
        <KeyTakeaway>
          Think about trade-offs, alignment, and balance. The most effective HR
          strategies in the simulation are those that create strong and
          sustainable performance across all four BSC perspectives.
        </KeyTakeaway>
      </div>

      <Callout title="Think Like an HR Leader" icon={Target} tone="amber">
        If your team improves financial performance but employee engagement and
        learning outcomes decline, would you consider that a successful HR
        strategy? What additional information would you need before making that
        judgment?
      </Callout>
    </>
  );
}
