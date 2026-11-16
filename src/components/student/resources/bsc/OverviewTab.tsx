import { Gauge, Info, Target } from "lucide-react";
import {
  ORGANIZATIONAL_KPIS,
  PERSPECTIVES,
  scoredMetricsFor,
} from "@/lib/student/bsc-reference";
import {
  Callout,
  KeyTakeaway,
  PERSPECTIVE_STYLE,
  Panel,
  SectionTitle,
  StepFlow,
} from "@/components/student/resources/bsc/BscParts";

const TRADITIONAL = [
  ["Financial", "Financial — HR financial stewardship and contribution"],
  ["Customer", "Employee — workforce experience and outcomes"],
  ["Internal Business Process", "Internal Process — effectiveness of HR processes"],
  ["Learning & Growth", "Learning & Growth — workforce capability and HR development"],
] as const;

export function OverviewTab() {
  return (
    <>
      <div className="grid gap-5 lg:grid-cols-2">
        <Callout title="What Is the HR Balance Scorecard?" icon={Info}>
          The HR Balance Scorecard is a strategic performance framework that
          translates your HR decisions into measurable results across four
          perspectives: Financial, Employee, Internal Process, and Learning &amp;
          Growth. Unlike a traditional organizational Balanced Scorecard, this
          version focuses on HR effectiveness, workforce outcomes, and the
          contribution of HR decisions to broader organizational performance.
          It helps you see how people, processes, investments, and capabilities
          work together to create organizational value.
        </Callout>
        <Callout title="Why It Matters" icon={Target} tone="amber">
          <ul className="list-disc space-y-1.5 pl-5 marker:text-red-500">
            <li>Connects HR decisions to organizational performance.</li>
            <li>Helps you balance short-term results and long-term capability.</li>
            <li>Shows trade-offs and the broader impact of your decisions.</li>
            <li>Provides a consistent way to track and compare results across rounds.</li>
          </ul>
        </Callout>
      </div>

      <div>
        <SectionTitle
          title="The Four BSC Perspectives"
          subtitle="The HR Balance Scorecard evaluates your performance across four complementary perspectives."
        />
        <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {PERSPECTIVES.map((p) => {
            const s = PERSPECTIVE_STYLE[p.id];
            const Icon = s.icon;
            return (
              <article key={p.id} className={`rounded-xl border p-4 ${s.border} ${s.soft}`}>
                <div className="flex items-center gap-2">
                  <Icon className={`h-6 w-6 ${s.text}`} aria-hidden />
                  <h3 className={`text-lg font-bold ${s.text}`}>{p.title}</h3>
                </div>
                <p className="mt-1 text-sm font-semibold text-[var(--portal-ink)]">
                  {p.question}
                </p>
                <p className="mt-3 rounded-md bg-white/70 px-2 py-1 text-xs font-bold text-[var(--portal-title)]">
                  Scored metrics
                </p>
                <ul className="mt-2 space-y-1 text-sm text-[var(--portal-ink)]">
                  {scoredMetricsFor(p.id).map((m) => (
                    <li key={m.id} className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.dot}`} />
                      {m.name}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
        <p className="mt-3 text-sm text-[var(--portal-muted)]">
          {ORGANIZATIONAL_KPIS.map((k) => k.name).join(", ")} are broader
          organizational outcomes. You will see them in your Workforce Brief, but
          they are not part of the HR Balance Scorecard: HR effectiveness and
          company financial performance are related, but they are not the same
          thing.
        </p>
      </div>

      <Panel>
        <SectionTitle title="Adapted for HR" subtitle="How the four perspectives differ from the traditional Balanced Scorecard." />
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--portal-sidebar-border)] text-xs uppercase tracking-wide text-[var(--portal-muted)]">
                <th className="py-2 pr-4 font-bold">Traditional Balanced Scorecard</th>
                <th className="py-2 font-bold">Real HR Simulation HR Balance Scorecard</th>
              </tr>
            </thead>
            <tbody>
              {TRADITIONAL.map(([a, b]) => (
                <tr key={a} className="border-b border-[var(--portal-sidebar-border)] last:border-0">
                  <td className="py-2 pr-4 text-[var(--portal-ink)]">{a}</td>
                  <td className="py-2 font-semibold text-[var(--portal-title)]">{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-[var(--portal-ink)]">
          The biggest change is that the <strong>Employee</strong> perspective
          replaces the Customer perspective: employees are the central
          stakeholders whose experience, capability, engagement, and retention
          drive organizational performance.
        </p>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel>
          <SectionTitle icon={Gauge} title="How the Scorecard Works in the Simulation" />
          <div className="mt-4">
            <StepFlow
              steps={[
                { title: "Make HR Decisions" },
                { title: "Decisions Affect HR Metrics" },
                { title: "Metrics Roll Up to BSC Perspectives" },
                { title: "Overall Score & Results" },
              ]}
            />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-[var(--portal-muted)]">
            This is a simplified view. Your company&apos;s revenue and profit are
            calculated separately from the scorecard, and your strategy decides
            how much each perspective counts. The How It Works tab explains the
            details.
          </p>
        </Panel>
        <KeyTakeaway>
          There is no single &ldquo;winning&rdquo; decision. Success in the Real HR
          Simulation comes from making balanced, strategic trade-offs that
          improve performance across all four BSC perspectives.
        </KeyTakeaway>
      </div>
    </>
  );
}
