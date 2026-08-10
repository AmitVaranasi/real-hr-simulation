import { LearningGuidesView } from "@/components/student/resources/LearningGuidesView";
import { loadResourcesContext } from "@/lib/student/load-resources-context";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LearningGuidesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/resources/learning-guides");

  const context = await loadResourcesContext();
  return <LearningGuidesView context={context} />;
}
