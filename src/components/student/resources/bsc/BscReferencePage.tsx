import { redirect } from "next/navigation";
import { BscReferenceShell } from "@/components/student/resources/bsc/BscReferenceShell";
import { FourPerspectivesTab } from "@/components/student/resources/bsc/FourPerspectivesTab";
import { HowItWorksTab } from "@/components/student/resources/bsc/HowItWorksTab";
import { KeyMetricsTab } from "@/components/student/resources/bsc/KeyMetricsTab";
import { OverviewTab } from "@/components/student/resources/bsc/OverviewTab";
import { UsingResultsTab } from "@/components/student/resources/bsc/UsingResultsTab";
import { withSimulationConfig } from "@/lib/db/simulation-config";
import { loadResourcesContext } from "@/lib/student/load-resources-context";
import {
  bscTabHref,
  currentStrategyWeights,
  type BscReferenceData,
  type BscTabSlug,
} from "@/lib/student/bsc-reference";
import { createClient } from "@/lib/supabase/server";

/**
 * Server page for one tab of Understanding the HR Balance Scorecard.
 * Read-only: it reads the student's team context and the scoring
 * configuration, and writes nothing.
 */
export async function BscReferencePage({ tab }: { tab: BscTabSlug }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(bscTabHref(tab))}`);

  const context = await loadResourcesContext();
  let data: BscReferenceData = { strategy: null, strategyWeights: {} };
  if (tab === "how-it-works") {
    // Instructor overrides to strategy weights live in the saved simulation
    // configuration, so read them the same way round scoring does.
    const strategyWeights = await withSimulationConfig(() =>
      currentStrategyWeights()
    );
    data = {
      strategy: context.strategy === "—" ? null : context.strategy,
      strategyWeights,
    };
  }

  return (
    <BscReferenceShell active={tab} context={context}>
      {tab === "" ? <OverviewTab /> : null}
      {tab === "four-perspectives" ? <FourPerspectivesTab /> : null}
      {tab === "key-metrics" ? <KeyMetricsTab /> : null}
      {tab === "how-it-works" ? <HowItWorksTab data={data} /> : null}
      {tab === "using-results" ? <UsingResultsTab /> : null}
    </BscReferenceShell>
  );
}
