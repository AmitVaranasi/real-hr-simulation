"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  CircleHelp,
  ClipboardList,
  FileCheck2,
  Home,
  LayoutDashboard,
  Library,
  Lightbulb,
  Map,
} from "lucide-react";
import { NAVIGATION_AREAS } from "@/lib/student/help-center-content";
import {
  HelpInfoBanner,
  HelpPageHeader,
  HelpQuickLinksPanel,
  HelpSideCard,
} from "@/components/student/help/HelpShared";

const ICONS = [
  Home,
  LayoutDashboard,
  ClipboardList,
  FileCheck2,
  BarChart3,
  Building2,
  Library,
  CircleHelp,
];

export function NavigationHelpView() {
  return (
    <div className="help-center pb-10">
      <HelpPageHeader
        breadcrumb="Simulation Navigation"
        title="Simulation Navigation"
        subtitle="Learn where key features are located, how to move through the simulation, and what each area helps you accomplish."
      />

      <div className="mt-4">
        <HelpInfoBanner>
          Use the information below to understand the main areas of the
          simulation and what you can do in each one.
        </HelpInfoBanner>
      </div>

      <div className="mt-5 grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(240px,300px)]">
        <div className="min-w-0 space-y-3">
          <h2 className="text-hc-section font-bold text-[var(--portal-title)]">
            Main Areas of the Simulation
          </h2>
          {NAVIGATION_AREAS.map((area, i) => {
            const Icon = ICONS[i] ?? Map;
            return (
              <Link
                key={area.href}
                href={area.href}
                className="flex items-center gap-3 rounded-xl border border-[var(--portal-sidebar-border)] bg-white px-4 py-3.5 shadow-sm transition-colors hover:border-[var(--portal-primary)]/40"
              >
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--portal-primary-soft)] text-[var(--portal-primary)]">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-hc-card font-bold text-[var(--portal-title)]">
                    {area.title}
                  </span>
                  <span className="mt-0.5 block text-hc-small text-[var(--portal-muted)]">
                    {area.description}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-[var(--portal-muted)]" />
              </Link>
            );
          })}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--portal-sidebar-border)] bg-white px-5 py-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--portal-primary-soft)] text-[var(--portal-primary)]">
                <Map className="h-5 w-5" />
              </span>
              <div>
                <p className="text-hc-card font-bold text-[var(--portal-title)]">
                  Need a visual overview?
                </p>
                <p className="mt-1 text-hc-small text-[var(--portal-muted)]">
                  Use this page anytime as your map of the student portal.
                </p>
              </div>
            </div>
            <Link
              href="/help"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--portal-navy)] px-4 py-2.5 text-hc-body font-semibold text-white hover:bg-[var(--portal-title)]"
            >
              Back to Help Center
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <aside className="min-w-0 space-y-4">
          <HelpSideCard title="How to Use This Page" icon={Map} accent="green">
            <ul className="space-y-3 text-hc-small text-[var(--portal-ink)]">
              {[
                "Explore each area to understand what it helps you do.",
                "Use the links to navigate directly to that area.",
                "Return here anytime if you are unsure where to go next.",
                "For more detail, visit the individual Help Center topics.",
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  {tip}
                </li>
              ))}
            </ul>
          </HelpSideCard>
          <HelpQuickLinksPanel />
          <HelpSideCard title="Tip" icon={Lightbulb} accent="orange">
            <p className="text-hc-small text-[var(--portal-muted)]">
              You can always return to this page from the Help Center menu on the
              left.
            </p>
          </HelpSideCard>
        </aside>
      </div>
    </div>
  );
}
