import { BarChart3, ClipboardList, Scale, Trophy, Users } from "lucide-react";
import {
  ORGANIZATIONAL_KPIS,
  PERSPECTIVES,
  SUPPORTING_METRICS,
  scoredMetricsFor,
  type ReferenceMetric,
} from "@/lib/student/bsc-reference";
import { ResourcesInfoBanner } from "@/components/student/resources/ResourcesShared";
import {
  DirectionTag,
  KeyTakeaway,
  PERSPECTIVE_STYLE,
  Panel,
  SectionTitle,
  StepFlow,
} from "@/components/student/resources/bsc/BscParts";

/** Name plus an optional "why it matters" disclosure, so the table stays scannable. */
function MetricName({ metric, dot }: { metric: ReferenceMetric; dot: string }) {
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-start gap-2 font-semibold text-[var(--portal-title)] [&::-webkit-details-marker]:hidden">
        <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
        <span className="underline decoration-dotted underline-offset-2 group-open:no-underline">
          {metric.name}
        </span>
      </summary>
      <p className="mt-1 pl-3.5 text-xs font-normal leading-relaxed text-[var(--portal-muted)]">
        <strong className="font-semibold text-[var(--portal-ink)]">Why it matters:</strong>{" "}
        {metric.whyItMatters}
      </p>
    </details>
  );
}

function OtherMetricsTable({
  title,
  intro,
  metrics,
}: {
  title: string;
  intro: string;
  metrics: ReferenceMetric[];
}) {
  return (
    <Panel>
      <h3 className="text-base font-bold text-[var(--portal-title)]">{title}</h3>
      <p className="mt-0.5 text-sm text-[var(--portal-muted)]">{intro}</p>
      <dl className="mt-3 space-y-2.5 text-sm">
        {metrics.map((m) => (
          <div key={m.id} className="grid gap-1 sm:grid-cols-[150px_minmax(0,1fr)]">
            <dt className="font-semibold text-[var(--portal-title)]">{m.name}</dt>
            <dd className="text-[var(--portal-ink)]">
              {m.definition}{" "}
              <span className="text-[var(--portal-muted)]">{m.whyItMatters}</span>
            </dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

export function KeyMetricsTab() {
  return (
    <>
      <SectionTitle
        title="Key HR Metrics"
        subtitle="The key HR metrics translate your HR decisions into measurable results across the four Balanced Scorecard perspectives."
      />
      <ResourcesInfoBanner>
        These are the metrics the simulation scores. Each one shows how well
        your HR strategy is working and contributes to one perspective score.
        Select a metric name to see why it matters.
      </ResourcesInfoBanner>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {PERSPECTIVES.map((p) => {
          const s = PERSPECTIVE_STYLE[p.id];
          const Icon = s.icon;
          return (
            <article key={p.id} className={`rounded-xl border p-4 ${s.border} ${s.soft}`}>
              <div className="flex items-center gap-2">
                <Icon className={`h-6 w-6 ${s.text}`} aria-hidden />
                <h3 className={`text-base font-bold ${s.text}`}>{p.title} Metrics</h3>
              </div>
              <p className="mt-1 text-sm text-[var(--portal-ink)]">{p.metricsIntro}</p>
              <div className="mt-3 grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-x-3 border-b border-black/10 pb-1 text-[0.6875rem] font-bold uppercase tracking-wide text-[var(--portal-muted)]">
                <span>Key metric</span>
                <span>What it measures</span>
              </div>
              <ul className="divide-y divide-black/5">
                {scoredMetricsFor(p.id).map((m) => (
                  <li
                    key={m.id}
                    className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-x-3 py-2.5 text-sm"
                  >
                    <MetricName metric={m} dot={s.dot} />
                    <div>
                      <p className="text-[var(--portal-ink)]">{m.definition}</p>
                      <DirectionTag direction={m.direction} />
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>

      <p className="text-sm leading-relaxed text-[var(--portal-ink)]">
        A single HR decision may influence several metrics across different
        perspectives. Understanding these relationships helps you interpret
        your results and evaluate strategic trade-offs.
      </p>

      <div className="grid gap-5 lg:grid-cols-2">
        <OtherMetricsTable
          title="Supporting HR indicators (not scored)"
          intro="Calculated and reported in your Workforce Brief to help you interpret results. They do not count directly toward a perspective score."
          metrics={SUPPORTING_METRICS}
        />
        <OtherMetricsTable
          title="Organizational KPIs (not scored)"
          intro="Broader business results. Your HR decisions influence them, but so do your industry and the economy, so they are reported separately from the HR Balance Scorecard."
          metrics={ORGANIZATIONAL_KPIS}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel>
          <SectionTitle title="How the Metrics Connect" />
          <div className="mt-4">
            <StepFlow
              steps={[
                { title: "HR Decisions", icon: Users },
                { title: "Key HR Metrics", icon: BarChart3 },
                { title: "BSC Perspectives", icon: Scale },
                { title: "Overall Performance", icon: Trophy },
              ]}
            />
          </div>
          <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-[var(--portal-muted)]">
            <ClipboardList className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            A simplified, conceptual sequence. Industry, strategy, economic
            conditions, and earlier rounds also shape your results; see How It
            Works in the Simulation.
          </p>
        </Panel>
        <KeyTakeaway>
          Key HR metrics give you a clear, objective view of how your HR
          decisions are performing, where you are making progress, and where you
          may need to adjust your strategy. Knowing what a metric measures is
          the first step; deciding what a change in it means takes judgment.
        </KeyTakeaway>
      </div>
    </>
  );
}
