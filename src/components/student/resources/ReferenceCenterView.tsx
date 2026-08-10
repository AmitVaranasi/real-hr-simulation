"use client";

import Link from "next/link";
import { Check, Lightbulb } from "lucide-react";
import {
  REFERENCE_CARDS,
  ResourcesBreadcrumb,
  ResourcesContextCards,
  ResourcesFooter,
  ResourcesInfoBanner,
  type ResourcesContext,
} from "@/components/student/resources/ResourcesShared";

export function ReferenceCenterView({ context }: { context: ResourcesContext }) {
  return (
    <div className="pb-8">
      <ResourcesBreadcrumb current="Simulation Reference Center" />

      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-[28px] font-bold text-[var(--portal-title)]">
            Simulation Reference Center
          </h1>
          <p className="mt-1 text-sm text-[var(--portal-muted)]">
            Understand how the simulation works and how to interpret key
            information. These references will help you use the simulation more
            effectively.
          </p>
        </div>
        <ResourcesContextCards context={context} />
      </div>

      <div className="mt-4">
        <ResourcesInfoBanner>
          These references explain key features and reports in the simulation so
          you can better understand your results and improve your decisions.
        </ResourcesInfoBanner>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {REFERENCE_CARDS.map((card, i) => {
          const Icon = card.icon;
          return (
            <article
              key={card.title}
              className="flex flex-col rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm"
            >
              <span
                className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${card.color}`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <h2 className="mt-3 text-base font-bold text-[var(--portal-title)]">
                {i + 1}. {card.title}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--portal-muted)]">
                {card.body}
              </p>
              <div className="mt-4 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--portal-muted)]">
                  You&apos;ll Learn
                </p>
                <ul className="mt-2 space-y-2">
                  {card.learn.map((item) => (
                    <li
                      key={item}
                      className="flex gap-2 text-xs leading-snug text-[var(--portal-ink)]"
                    >
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                href="/resources/reference"
                className="mt-5 inline-flex text-sm font-semibold text-[var(--portal-primary)] hover:underline"
              >
                View Reference →
              </Link>
            </article>
          );
        })}
      </div>

      <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-[var(--portal-ink)]">
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p className="leading-relaxed">
          <strong className="font-semibold">Remember:</strong> Use these
          references alongside your industry context, strategy, and round
          results. The more you understand the simulation, the better decisions
          you and your team will make.
        </p>
      </div>

      <ResourcesFooter />
    </div>
  );
}
