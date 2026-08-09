import { ReferenceCenterView } from "@/components/student/resources/ReferenceCenterView";
import { loadResourcesContext } from "@/lib/student/load-resources-context";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ReferenceCenterPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/resources/reference");

  const context = await loadResourcesContext();
  return <ReferenceCenterView context={context} />;
}
