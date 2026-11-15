import { notFound } from "next/navigation";
import { BscReferencePage } from "@/components/student/resources/bsc/BscReferencePage";
import { isBscTabSlug } from "@/lib/student/bsc-reference";

export const dynamic = "force-dynamic";

export default async function BscTabPage({
  params,
}: {
  params: Promise<{ tab: string }>;
}) {
  const { tab } = await params;
  // The overview lives at the base path; "" is not a valid segment here.
  if (!tab || !isBscTabSlug(tab)) notFound();
  return <BscReferencePage tab={tab} />;
}
