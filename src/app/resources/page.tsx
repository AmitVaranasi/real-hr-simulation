import { ResourcesOverview } from "@/components/student/ResourcesOverview";
import { loadResourcesContext } from "@/lib/student/load-resources-context";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ResourcesHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/resources");

  const context = await loadResourcesContext();
  return <ResourcesOverview context={context} />;
}
