import { HelpOverview } from "@/components/student/help/HelpOverview";
import { TutorialReplayCard } from "@/components/student/tutorial/TutorialReplayCard";
import { tutorialStatus } from "@/lib/student/tutorial";
import { createClient } from "@/lib/supabase/server";

export default async function HelpPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <TutorialReplayCard
        status={tutorialStatus(user?.user_metadata)}
        returnTo="/help"
      />
      <HelpOverview />
    </>
  );
}
