import { notFound } from "next/navigation";
import { PreSimModuleView } from "@/components/student/PreSimModuleView";
import { PRE_SIM_MODULES, type PreSimSlug } from "@/lib/student/pre-sim-content";

export function generateStaticParams() {
  return Object.keys(PRE_SIM_MODULES).map((module) => ({ module }));
}

export default async function PreSimModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module } = await params;
  const content = PRE_SIM_MODULES[module as PreSimSlug];
  if (!content) notFound();

  return <PreSimModuleView slug={module as PreSimSlug} content={content} />;
}
