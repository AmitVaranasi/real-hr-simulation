import { DownloadsView } from "@/components/student/resources/DownloadsView";
import { loadResourcesContext } from "@/lib/student/load-resources-context";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DownloadsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/resources/downloads");

  const context = await loadResourcesContext();
  return <DownloadsView context={context} />;
}
