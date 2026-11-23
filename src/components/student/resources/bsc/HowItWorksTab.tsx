import {
  BarChart3,
  ClipboardCheck,
  Lightbulb,
  Link2,
  Scale,
  Target,
  Trophy,
} from "lucide-react";
import {
  ALL_STRATEGIES,
  DECISION_AREA_LINKS,
  metricNamesMovedBy,
  perspectivesMovedBy,
  PERSPECTIVES,
  STRATEGY_BONUS_TARGETS,
  type BscReferenceData,
  type PerspectiveWeights,
} from "@/lib/student/bsc-reference";
import {
  Callout,
  KeyTakeaway,
  PERSPECTIVE_STYLE,
  Panel,
  PerspectiveChip,
  PerspectiveDonut,
  SectionTitle,
  StepFlow,
} from "@/components/student/resources/bsc/BscParts";

function WeightList({ weights }: { weights: PerspectiveWeights }) {
  return (
    <ul className="space-y-2.5">
      {PERSPECTIVES.map((p) => (
        <li key={p.id} className="flex items-start gap-2 text-sm">
          <span className={`mt-1 h-3 w-3 shrink-0 rounded-sm ${PERSPECTIVE_STYLE[p.id].dot}`} />
          <span>
            <strong className="text-[var(--portal-title)]">
              {p.title} – {weights[p.id]}%
            </strong>
            <span className="block text-xs text-[var(--portal-muted)]">{p.short}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function HowItWorksTab({ data }: { data: BscReferenceData }) {
  const own =
    data.strategy && data.strategy in data.strategyWeights
      ? data.strategyWeights[data.strategy as keyof typeof data.strategyWeights]!
      : null;

  return (
    <>
      <SectionTitle
        title="How It Works in the Simulation"
        subtitle="A step-by-step look at how your HR decisions, metrics, and the HR Balance Scorecard work together in each round."
      />

      <Panel>
        <StepFlow
          steps={[
            {
              title: "Understand the Situation",
              body: "Review your industry, strategy, and Workforce Brief to identify key opportunities and challenges.",
              icon: Target,
            },
            {
              title: "Make HR Decisions",
              body: "Choose your HR actions across the seven decision areas.",
              icon: ClipboardCheck,
              tone: "employee",
            },
            {
              title: "See the Impact on Metrics",
              body: "Your decisions change key HR metrics such as turnover, engagement, and cost per hire.",
              icon: BarChart3,
              tone: "process",
            },
            {
              title: "Update the BSC Perspectives",
              body: "The metrics roll up into the four perspective scores.",
              icon: Scale,
              tone: "learning",
            },
            {
              title: "Review Results and Learn",
              body: "See your BSC score, analyze trade-offs, and adjust your strategy for the next round.",
              icon: Trophy,
            },
          ]}
        />
      </Panel>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel>
          <SectionTitle
            icon={Link2}
            title="The Decision-to-Result Connection"
            subtitle="The perspectives each decision area moves in the current version of the simulation. These are the main links, not every possible effect."
          />
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[460px] text-left text-sm">
              <thead>
                <tr className="bg-[var(--portal-primary-soft)] text-xs font-bold text-[var(--portal-title)]">
                  <th className="px-3 py-2">HR decision area</th>
                  <th className="px-3 py-2">Perspectives influenced</th>
                </tr>
              </thead>
              <tbody>
                {DECISION_AREA_LINKS.map((d) => (
                  <tr key={d.area} className="border-b border-[var(--portal-sidebar-border)] align-top last:border-0">
                    <td className="px-3 py-2.5">
                      <p className="font-semibold text-[var(--portal-title)]">{d.area}</p>
                      {d.moves.length ? (
                        <p className="text-xs text-[var(--portal-muted)]">
                          {metricNamesMovedBy(d).join(", ")}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1.5">
                        {perspectivesMovedBy(d).map((p) => (
                          <PerspectiveChip key={p} id={p} />
                        ))}
                        {d.moves.length === 0 ? <PerspectiveChip id="financial" /> : null}
                      </div>
                      {d.note ? (
                        <p className="mt-1.5 text-xs leading-relaxed text-amber-800">{d.note}</p>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-[var(--portal-muted)]">
            Every decision area also spends part of your HR budget. Spending
            well above or below your available budget lowers Budget Adherence
            in the Financial perspective.
          </p>
        </Panel>

        <Panel>
          <SectionTitle
            icon={Scale}
            title="How the BSC Score Is Calculated"
            subtitle="Your overall score combines the four perspective scores. All four perspectives count equally, at 25% each, whatever your strategy."
          />
          <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row sm:items-start">
            <PerspectiveDonut
              weights={own}
              label="Perspective weights"
            />
            {own ? (
              <WeightList weights={own} />
            ) : (
              <p className="text-sm text-[var(--portal-ink)]">
                Join a team to see your perspective weights.
              </p>
            )}
          </div>

          <details className="mt-4 rounded-lg border border-[var(--portal-sidebar-border)] p-3">
            <summary className="cursor-pointer text-sm font-semibold text-[var(--portal-primary)]">
              Strategic alignment bonus for every strategy
            </summary>
            <p className="mt-2 text-xs leading-relaxed text-[var(--portal-ink)]">
              Your strategy does not change the weights. It earns up to 3 bonus
              points when your results reach both of its targets.
            </p>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-xs">
                <thead>
                  <tr className="text-[var(--portal-muted)]">
                    <th className="py-1 pr-2 font-bold">Strategy</th>
                    <th className="py-1 pr-2 font-bold">Targets for the +3 bonus</th>
                  </tr>
                </thead>
                <tbody>
                  {ALL_STRATEGIES.map((s) => (
                    <tr
                      key={s}
                      className={s === data.strategy ? "font-bold text-[var(--portal-title)]" : "text-[var(--portal-ink)]"}
                    >
                      <td className="py-1 pr-2 align-top">{s}</td>
                      <td className="py-1 pr-2">{STRATEGY_BONUS_TARGETS[s]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>

          <ul className="mt-4 list-disc space-y-1.5 pl-5 text-xs leading-relaxed text-[var(--portal-ink)]">
            <li>
              Each metric is compared with benchmark levels and contributes a
              set share of its perspective score.
            </li>
            <li>
              Your industry, strategy, and economic conditions adjust results:
              industry conditions shift some metric values and industry rules can deduct points, meeting your strategy&apos;s
              two targets earns a bonus of up to 3 points, and the economy
              mainly affects revenue and costs.
            </li>
            <li>
              Results carry forward: each round starts from where your company
              ended the last one.
            </li>
            <li>
              Revenue is set by a separate preliminary HR performance measure
              (Employee, Internal Process, and Learning &amp; Growth only). It is
              not your BSC score.
            </li>
            <li>Your overall score is between 0 and 100.</li>
          </ul>
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Callout title="Example: Training & Development" icon={Lightbulb} tone="green">
          If your team invests in Training &amp; Development, the investment may
          strengthen employee skills, engagement, and workforce capability. These
          improvements may contribute to greater productivity, quality, and
          financial performance in later rounds. The actual outcomes depend on
          your organization&apos;s conditions, other HR decisions, and the
          relationships modeled within the simulation.
        </Callout>
        <KeyTakeaway>
          The HR Balance Scorecard helps you understand how your decisions create
          value across the organization. Strong HR performance is not simply
          about reducing costs or maximizing one metric. It comes from making
          balanced, strategic decisions that strengthen employees, improve
          processes, build capabilities, and support financial performance over
          time. Balanced weights do not mean equal budgets.
        </KeyTakeaway>
      </div>
    </>
  );
}
