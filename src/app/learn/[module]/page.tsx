import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        href="/"
        className="text-sm font-medium text-[#e67e22] hover:underline"
      >
        ← Back to Real HR Simulation
      </Link>

      <header className="mt-6 border-b border-slate-200 pb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#e67e22]">
          Pre-Simulation Learning
        </p>
        <h1 className="mt-2 text-3xl font-bold text-[#0f172a]">{content.title}</h1>
        <p className="mt-2 text-lg text-[#6b7280]">{content.subtitle}</p>
        <p className="mt-4 text-sm leading-relaxed text-[#1f2937]">
          {content.intro}
        </p>
      </header>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-[#0f172a]">
          1. What Is {content.title}?
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[#1f2937]">
          {content.whatIs}
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-[#0f172a]">
          2. Why Does It Matter?
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {content.whyCards.map((card) => (
            <div
              key={card.title}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <h3 className="font-semibold text-[#0f172a]">{card.title}</h3>
              <p className="mt-2 text-sm text-[#6b7280]">{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-[#0f172a]">
          3. Decisions You May Encounter
        </h2>
        <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-[#1f2937]">
          {content.decisions.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
        <div className="mt-4 rounded-xl border border-[#f5d0a9] bg-[#fff4e8] p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[#e67e22]">
            Think Like an HR Leader
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[#1f2937]">
            {content.thinkLike}
          </p>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-[#0f172a]">
          4. Connecting to the Organization
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[#1f2937]">
          {content.connecting}
        </p>
        <p className="mt-4 text-sm font-medium text-[#0f172a]">
          {content.pathway}
        </p>
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/">
          <Button variant="outline">Back to landing</Button>
        </Link>
        <Link href="/login">
          <Button>Sign In</Button>
        </Link>
      </div>
    </div>
  );
}
