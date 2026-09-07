import { SimulationConfigCenter } from "@/components/instructor/SimulationConfigCenter";

export default async function SimulationConfigSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl px-4 py-8 sm:px-6">
      <SimulationConfigCenter initialTab={section} />
    </div>
  );
}
