import { MetricsReferenceView } from "@/components/student/resources/MetricsReferenceView";
import { loadResourcesContext } from "@/lib/student/load-resources-context";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function MetricsReferencePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/resources/metrics");

  const context = await loadResourcesContext();
  return <MetricsReferenceView context={context} />;
}
