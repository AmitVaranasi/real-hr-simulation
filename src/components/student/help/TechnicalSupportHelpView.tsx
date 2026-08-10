"use client";

import Link from "next/link";
import {
  CheckCircle2,
  FileCheck2,
  Lightbulb,
  Mail,
  MessageCircle,
  RefreshCw,
  Settings,
  Ticket,
  Wifi,
} from "lucide-react";
import {
  TECH_SUPPORT_STEPS,
  TROUBLESHOOT_CATEGORIES,
} from "@/lib/student/help-center-content";
import {
  HelpPageHeader,
  HelpQuickLinksPanel,
  HelpSideCard,
} from "@/components/student/help/HelpShared";

const CAT_ICONS = [FileCheck2, Settings, CheckCircle2, FileCheck2, Settings];

export function TechnicalSupportHelpView() {
  return (
    <div className="help-center pb-10">
      <HelpPageHeader
        breadcrumb="Technical Support"
        title="Technical Support"
        subtitle="We're here to help! If you're experiencing an issue, choose a way to connect with our support team or troubleshoot common problems."
      />

      <div className="mt-5 grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(240px,300px)]">
        <div className="min-w-0 space-y-6">
          <section>
            <h2 className="text-hc-section font-bold text-[var(--portal-title)]">
              Get Support
            </h2>
            <div className="mt-3 grid gap-4 md:grid-cols-3">
              {[
                {
                  icon: MessageCircle,
                  title: "Live Chat Support",
                  body: "Chat with our support team in real time during business hours.",
                  cta: "Start Live Chat",
                  meta: "Mon–Fri, 8:00 AM – 6:00 PM CT",
                },
                {
                  icon: Mail,
                  title: "Email Support",
                  body: "Send us a detailed message and we'll respond within 1 business day.",
                  cta: "Send Email",
                  meta: "We reply within 1 business day",
                },
                {
                  icon: Ticket,
                  title: "Submit a Ticket",
                  body: "Create a support ticket and we'll track your issue until it's resolved.",
                  cta: "Submit Ticket",
                  meta: "We'll respond within 1 business day",
                },
              ].map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.title}
                    className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm"
                  >
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--portal-primary-soft)] text-[var(--portal-primary)]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <p className="mt-3 text-hc-card font-bold text-[var(--portal-title)]">
                      {card.title}
                    </p>
                    <p className="mt-2 text-hc-small text-[var(--portal-muted)]">
                      {card.body}
                    </p>
                    <button
                      type="button"
                      className="mt-4 rounded-lg bg-[var(--portal-navy)] px-3 py-2 text-hc-small font-semibold text-white hover:bg-[var(--portal-title)]"
                    >
                      {card.cta}
                    </button>
                    <p className="mt-3 text-hc-small text-[var(--portal-muted)]">
                      {card.meta}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="text-hc-section font-bold text-[var(--portal-title)]">
              1. What&apos;s the issue?
            </h2>
            <p className="mt-1 text-hc-small text-[var(--portal-muted)]">
              Choose the category that best describes the problem you&apos;re
              experiencing.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {TROUBLESHOOT_CATEGORIES.map((cat, i) => {
                const Icon = CAT_ICONS[i] ?? Settings;
                return (
                  <div
                    key={cat.title}
                    className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm"
                  >
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--portal-primary-soft)] text-[var(--portal-primary)]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <p className="mt-3 text-hc-card font-bold text-[var(--portal-title)]">
                      {cat.title}
                    </p>
                    <p className="mt-2 text-hc-small text-[var(--portal-muted)]">
                      {cat.description}
                    </p>
                    <p className="mt-3 text-hc-small font-semibold text-[var(--portal-primary)]">
                      View Solutions
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="text-hc-section font-bold text-[var(--portal-title)]">
              Before You Contact Us
            </h2>
            <p className="mt-1 text-hc-small text-[var(--portal-muted)]">
              Try these quick steps. They may help resolve your issue faster.
            </p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: RefreshCw,
                  title: "Refresh the Page",
                  body: "Sometimes a simple refresh can fix the issue.",
                },
                {
                  icon: Settings,
                  title: "Clear Browser Cache",
                  body: "Clear your cache and cookies, then try again.",
                },
                {
                  icon: Wifi,
                  title: "Check Connection",
                  body: "Ensure you have a stable internet connection.",
                },
                {
                  icon: CheckCircle2,
                  title: "Use Supported Browser",
                  body: "For best performance, use Chrome, Edge, or Firefox.",
                },
              ].map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.title}
                    className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm"
                  >
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--portal-primary-soft)] text-[var(--portal-primary)]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <p className="mt-3 text-hc-card font-bold text-[var(--portal-title)]">
                      {step.title}
                    </p>
                    <p className="mt-1 text-hc-small text-[var(--portal-muted)]">
                      {step.body}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="rounded-xl border border-[var(--portal-primary)]/20 bg-[var(--portal-primary-soft)] px-5 py-4">
            <p className="text-hc-card font-bold text-[var(--portal-title)]">
              Include Helpful Details
            </p>
            <p className="mt-1 text-hc-small text-[var(--portal-muted)]">
              When contacting support, include your company name, round, a
              description of the issue, and any error messages you see.
              Screenshots are also very helpful.
            </p>
            <ol className="mt-3 space-y-1 text-hc-small text-[var(--portal-ink)]">
              {TECH_SUPPORT_STEPS.map((step, i) => (
                <li key={step}>
                  {i + 1}. {step}
                </li>
              ))}
            </ol>
          </div>
        </div>

        <aside className="min-w-0 space-y-4">
          <HelpSideCard title="Quick Tips" icon={Lightbulb} accent="blue">
            <ul className="space-y-3 text-hc-small text-[var(--portal-ink)]">
              {[
                "Try refreshing the page.",
                "Clear your browser cache and cookies if pages aren't loading.",
                "Ensure you are using a supported browser (Chrome, Edge, Firefox).",
                "Check your internet connection and try again.",
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  {tip}
                </li>
              ))}
            </ul>
          </HelpSideCard>
          <HelpQuickLinksPanel />
          <HelpSideCard title="System Status" icon={CheckCircle2} accent="green">
            <p className="text-hc-small text-[var(--portal-muted)]">
              All systems are operational.
            </p>
            <ul className="mt-3 space-y-2 text-hc-small text-[var(--portal-ink)]">
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Simulation Platform — Operational
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Reports &amp; Analytics — Operational
              </li>
            </ul>
          </HelpSideCard>
        </aside>
      </div>
    </div>
  );
}
