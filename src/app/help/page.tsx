"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  FileText,
  Users,
  Target,
  TrendingUp,
  DollarSign,
  MessageSquare,
  Sliders,
  Download,
  CheckCircle2,
  ArrowRight,
  Info,
  Lightbulb,
  ExternalLink,
  X,
  ShieldCheck,
  ChevronRight,
  HelpCircle,
  Wrench,
  UserCheck,
  Sparkles,
} from "lucide-react";

interface HelpTopic {
  id: string;
  number: string;
  title: string;
  category: "reports" | "decisions" | "general";
  description: string;
  icon: React.ElementType;
  badgeBg: string;
  badgeText: string;
  accentBorder: string;
  details: {
    overview: string;
    keyPoints: string[];
    proTip: string;
    actionLink?: { label: string; href: string };
  };
}

const HELP_TOPICS: HelpTopic[] = [
  {
    id: "overview",
    number: "1",
    title: "Overview",
    category: "reports",
    description:
      "Learn how the reporting system works, when results update, and how to navigate between report types.",
    icon: FileText,
    badgeBg: "bg-blue-100 text-blue-700",
    badgeText: "blue",
    accentBorder: "hover:border-blue-300",
    details: {
      overview:
        "The Real HR Simulation reporting system processes your team's decision inputs at the close of every round. Once processed, comprehensive financial, workforce, and strategic performance reports are made available.",
      keyPoints: [
        "Results generate automatically as soon as the instructor completes round processing.",
        "Use the Reports sub-navigation to toggle between Workforce Brief, Scorecard, and Financial Statements.",
        "Prior round performance data remains accessible throughout all subsequent simulation rounds for trend comparison.",
      ],
      proTip: "Review reports together with your team before drafting new round decisions.",
      actionLink: { label: "Go to Reports & HR Analytics", href: "/reports" },
    },
  },
  {
    id: "workforce-brief",
    number: "2",
    title: "The Workforce Brief",
    category: "reports",
    description:
      "Understand the executive summary of your organization's workforce metrics and performance.",
    icon: Users,
    badgeBg: "bg-teal-100 text-teal-700",
    badgeText: "teal",
    accentBorder: "hover:border-teal-300",
    details: {
      overview:
        "The Workforce Brief provides an executive overview of headcount, turnover rate, average productivity, engagement indices, and diversity metrics across your organization.",
      keyPoints: [
        "Headcount & Staffing Ratio: Tracks actual vs required staffing levels.",
        "Turnover & Morale: Measures voluntary departures and workforce stability.",
        "Productivity Index: Reflects average output per employee based on training and compensation.",
      ],
      proTip: "A sudden drop in productivity often points to understaffing or low morale.",
      actionLink: { label: "View Workforce Brief", href: "/reports/workforce-brief" },
    },
  },
  {
    id: "scorecard",
    number: "3",
    title: "HR Balance Scorecard",
    category: "reports",
    description:
      "Learn how your team's overall score is calculated across four key scorecard dimensions.",
    icon: Target,
    badgeBg: "bg-orange-100 text-orange-700",
    badgeText: "orange",
    accentBorder: "hover:border-orange-300",
    details: {
      overview:
        "Your team's performance is evaluated using a balanced scorecard framework divided into Financial, Customer/Employee, Internal Business Process, and Learning & Growth pillars.",
      keyPoints: [
        "Financial Pillar: Measures revenue growth, net income, and labor cost ratios.",
        "Employee Pillar: Evaluates turnover, satisfaction, DEI progress, and engagement.",
        "Process Pillar: Reflects hiring velocity, review coverage, and operational efficiency.",
        "Learning & Growth: Captures training hours, skill growth, and leadership development.",
      ],
      proTip: "Over-investing in one area at the expense of others can reduce your overall Scorecard multiplier.",
      actionLink: { label: "View Scorecard", href: "/reports" },
    },
  },
  {
    id: "workforce-performance",
    number: "4",
    title: "Workforce Performance",
    category: "reports",
    description:
      "Explore workforce metrics including engagement, retention, productivity, and diversity.",
    icon: TrendingUp,
    badgeBg: "bg-purple-100 text-purple-700",
    badgeText: "purple",
    accentBorder: "hover:border-purple-300",
    details: {
      overview:
        "Workforce Performance metrics drill down into employee sentiment, training efficacy, compensation competitiveness, and DEI initiative metrics.",
      keyPoints: [
        "Engagement Index: Derived from compensation ratios, benefits quality, and workplace environment.",
        "Retention Rate: Percentage of employees retained period-over-period.",
        "DEI Representation: Percentage of diverse leadership and fair promotion pathways.",
      ],
      proTip: "Consistent training investments yield cumulative productivity gains over multiple rounds.",
      actionLink: { label: "Check Resources Reference", href: "/resources/metrics" },
    },
  },
  {
    id: "financial-reports",
    number: "5",
    title: "Financial Reports",
    category: "reports",
    description:
      "Understand the financial statements, ratios, and what they reveal about your company.",
    icon: DollarSign,
    badgeBg: "bg-emerald-100 text-emerald-700",
    badgeText: "emerald",
    accentBorder: "hover:border-emerald-300",
    details: {
      overview:
        "Complete financial accounting including Income Statement (Profit & Loss), Balance Sheet, Cash Flow Statement, and Financial Ratio analysis.",
      keyPoints: [
        "Income Statement: Revenue minus Cost of Goods Sold, HR Operating Expenses, and Taxes.",
        "Cash Flow: Tracks operational cash inflow versus payroll, capital expenditure, and debt.",
        "Ratios: Return on Equity (ROE), Return on Assets (ROA), Profit Margin, and Labor Cost % of Sales.",
      ],
      proTip: "Monitor HR Expense % of Revenue to ensure personnel costs align with company size.",
      actionLink: { label: "View Profit & Loss Statement", href: "/reports/profit-loss" },
    },
  },
  {
    id: "feedback-coaching",
    number: "6",
    title: "Feedback & Coaching",
    category: "reports",
    description:
      "Learn how to use feedback from the system to guide your team's next actions.",
    icon: MessageSquare,
    badgeBg: "bg-amber-100 text-amber-700",
    badgeText: "amber",
    accentBorder: "hover:border-amber-300",
    details: {
      overview:
        "The automated HR Coach provides qualitative analysis of your round decisions, calling out strategic wins, unexpected bottlenecks, and recommended adjustments.",
      keyPoints: [
        "Narrative Feedback: Contextual insights on compensation, hiring, and morale.",
        "Budget Norm Warnings: Highlights decisions where spending significantly deviated from industry averages.",
        "Strategic Alignment: Evaluates whether choices matched your selected company strategy.",
      ],
      proTip: "Read Feedback & Coaching before setting budget targets for the next round.",
      actionLink: { label: "Check Decision Review", href: "/review" },
    },
  },
  {
    id: "trends-benchmarks",
    number: "7",
    title: "Trends & Benchmarks",
    category: "reports",
    description:
      "See how to analyze trends over time and compare performance to benchmarks.",
    icon: Sliders,
    badgeBg: "bg-indigo-100 text-indigo-700",
    badgeText: "indigo",
    accentBorder: "hover:border-indigo-300",
    details: {
      overview:
        "Compare your team's historical performance metrics round-over-round against industry averages and top-performing cohort benchmarks.",
      keyPoints: [
        "Multi-Round Charts: Graph revenue, turnover, and score trajectories over time.",
        "Industry Benchmarks: Compare your salary offerings and training budgets to market norms.",
        "Competitive Analysis: Track relative market position within your course section.",
      ],
      proTip: "Look for trends rather than single-round spikes to measure sustained growth.",
      actionLink: { label: "View Team Strategy", href: "/team/industry-strategy" },
    },
  },
  {
    id: "export-save",
    number: "8",
    title: "Export & Save Reports",
    category: "reports",
    description:
      "Learn how to download, save, and share reports for team and course requirements.",
    icon: Download,
    badgeBg: "bg-slate-100 text-slate-800",
    badgeText: "slate",
    accentBorder: "hover:border-slate-300",
    details: {
      overview:
        "Export individual financial statements or full executive report packages into PDF and Excel formats for coursework, presentations, or team debriefs.",
      keyPoints: [
        "PDF Export: Generates clean, formatted printable executive summaries.",
        "Excel/CSV Export: Provides raw metric tables for custom financial modeling.",
        "Archiving: Download end-of-round summaries to keep records for final course presentations.",
      ],
      proTip: "Use PDF exports for instructor assignments and Excel exports for team forecasting.",
      actionLink: { label: "Go to Downloadable Resources", href: "/resources/downloads" },
    },
  },
];

interface QuickGuideItem {
  id: string;
  question: string;
  answer: string;
  linkText: string;
  linkHref: string;
}

const QUICK_GUIDES: QuickGuideItem[] = [
  {
    id: "start",
    question: "Where Do I Start?",
    answer:
      "Begin with Getting Started in the Student Portal to understand your assigned team, company profile, industry background, and initial strategy. Next, explore the 7 HR Pre-Simulation Learning Modules under Resources before entering round decisions.",
    linkText: "Go to Getting Started",
    linkHref: "/dashboard/getting-started",
  },
  {
    id: "submit",
    question: "How Do I Submit Decisions?",
    answer:
      "Navigate to HR Decisions to enter inputs across Recruitment, Performance, Training, Employee Relations, Compensation, Org Design, and DEI. When ready, go to Review & Submit to review forecasts and lock in your team's decisions before the round deadline.",
    linkText: "Open HR Decisions Workspace",
    linkHref: "/decisions",
  },
  {
    id: "results",
    question: "Where Are My Results?",
    answer:
      "After your instructor computes the round, click Reports & HR Analytics to view your updated HR Balance Scorecard, Workforce Brief, Profit & Loss, Balance Sheet, Cash Flow, and AI HR Coaching insights.",
    linkText: "View Current Reports",
    linkHref: "/reports",
  },
  {
    id: "login",
    question: "I Can't Log In or Join My Team",
    answer:
      "Confirm you are using your registered student email address. If you need to join a team, use your professor's team code on the Join Team page. If password issues persist, use the Password Reset option or contact your instructor.",
    linkText: "Go to Login Page",
    linkHref: "/login",
  },
  {
    id: "support",
    question: "Technical Support",
    answer:
      "If you experience technical issues, page load glitches, or team access errors, verify your browser session or reach out to your course instructor. Technical inquiries are reviewed promptly within 1 business day.",
    linkText: "Contact Instructor",
    linkHref: "/team/instructor",
  },
];

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedTopic, setSelectedTopic] = useState<HelpTopic | null>(null);
  const [activeQuickGuide, setActiveQuickGuide] = useState<QuickGuideItem | null>(null);

  // Filter topics based on search query & selected category
  const filteredTopics = useMemo(() => {
    return HELP_TOPICS.filter((topic) => {
      const matchesSearch =
        searchQuery === "" ||
        topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.details.overview.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        activeCategory === "all" || topic.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  return (
    <div className="min-h-screen bg-[var(--portal-page,#f4f6f9)] text-[var(--portal-ink,#1f2937)] pb-12">
      {/* Top Header Banner */}
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-[#0b1739] via-[#132248] to-[#1d6ef5] p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-200">
              <Link href="/help" className="hover:underline">
                Help Center
              </Link>
              <span>&gt;</span>
              <span className="text-white">Reports &amp; Results</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Understanding Reports &amp; Results
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-blue-100 sm:text-base">
              Learn how to access, navigate, and interpret your team's results,
              reports, scorecards, and feedback after every round.
            </p>
          </div>

          {/* Search Box */}
          <div className="w-full md:w-80">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search help topics or FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-white/10 py-2.5 pl-10 pr-4 text-sm text-white placeholder-blue-200 backdrop-blur-md transition-all focus:border-white focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-200 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Informational Callout Box */}
      <div className="mb-6 flex items-start gap-3.5 rounded-xl border border-[var(--portal-primary,#1d6ef5)]/30 bg-[var(--portal-primary-soft,#eaf2ff)] p-4 text-sm text-[var(--portal-navy,#0b1739)] shadow-sm">
        <div className="mt-0.5 rounded-full bg-[var(--portal-primary,#1d6ef5)] p-1 text-white shrink-0">
          <Info className="h-4 w-4" />
        </div>
        <div className="leading-relaxed">
          <span className="font-semibold">Help Center Boundary: </span>
          Start with{" "}
          <Link
            href="/resources"
            className="font-medium text-[var(--portal-primary,#1d6ef5)] hover:underline"
          >
            Resources
          </Link>{" "}
          for core HR conceptual learning. Use this Help Center for platform
          navigation, technical troubleshooting, interpreting reports, and instructor
          support paths.
        </div>
      </div>

      {/* Main Grid Layout: Content Column (Left/Center) + Sidebar Widget Column (Right) */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left/Center Column: 8 Topic Cards + CTA Banner */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section Heading & Category Filters */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-[var(--portal-title,#0b1739)]">
                  Topics in This Section
                </h2>
                <p className="text-xs text-[var(--portal-muted,#6b7280)] mt-0.5">
                  Choose a topic below to learn more about reports, results, and how to use them.
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <button
                  onClick={() => setActiveCategory("all")}
                  className={`rounded-lg px-3 py-1.5 font-medium transition-all ${
                    activeCategory === "all"
                      ? "bg-[var(--portal-title,#0b1739)] text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  All Topics ({HELP_TOPICS.length})
                </button>
                <button
                  onClick={() => setActiveCategory("reports")}
                  className={`rounded-lg px-3 py-1.5 font-medium transition-all ${
                    activeCategory === "reports"
                      ? "bg-[var(--portal-title,#0b1739)] text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Reports ({HELP_TOPICS.length})
                </button>
              </div>
            </div>

            {/* Topic Cards Grid (4 rows x 2 cols) */}
            {filteredTopics.length === 0 ? (
              <div className="my-8 text-center text-sm text-slate-500">
                No help topics match your search query &quot;{searchQuery}&quot;. Try clearing your search.
              </div>
            ) : (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {filteredTopics.map((topic) => {
                  const Icon = topic.icon;
                  return (
                    <div
                      key={topic.id}
                      className={`group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${topic.accentBorder}`}
                    >
                      <div>
                        {/* Header Badge & Number */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--portal-primary-soft,#eaf2ff)] text-xs font-bold text-[var(--portal-primary,#1d6ef5)]">
                              {topic.number}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${topic.badgeBg}`}
                            >
                              <Icon className="h-3 w-3" />
                              Topic {topic.number}
                            </span>
                          </div>
                        </div>

                        {/* Title & Description */}
                        <h3 className="mt-3 text-sm font-bold text-[var(--portal-title,#0b1739)] group-hover:text-[var(--portal-primary,#1d6ef5)]">
                          {topic.number}. {topic.title}
                        </h3>
                        <p className="mt-1.5 text-xs leading-relaxed text-[var(--portal-muted,#6b7280)]">
                          {topic.description}
                        </p>
                      </div>

                      {/* View Topic Action */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <button
                          onClick={() => setSelectedTopic(topic)}
                          className="flex items-center gap-1 text-xs font-bold text-[var(--portal-primary,#1d6ef5)] hover:text-[var(--portal-brand-hover,#e84e14)] transition-colors"
                        >
                          View Topic
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action CTA Banner ("Want to See Your Results?") */}
          <div className="rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50 via-white to-amber-50 p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-1 rounded-xl bg-[var(--portal-brand,#ff5a1f)] p-2.5 text-white shadow-xs">
                  <BarChartIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--portal-title,#0b1739)]">
                    Want to See Your Results?
                  </h3>
                  <p className="mt-1 text-xs text-[var(--portal-ink,#1f2937)] max-w-md">
                    Go to Reports &amp; HR Analytics to explore your current round reports, balance scorecard, and performance data.
                  </p>
                </div>
              </div>

              <Link
                href="/reports"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--portal-brand,#ff5a1f)] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[var(--portal-brand-hover,#e84e14)] transition-colors"
              >
                Go to Reports &amp; HR Analytics
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Widgets (Key Takeaways, Quick Links, Tip) */}
        <div className="space-y-6">
          {/* Key Takeaways Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="rounded-lg bg-emerald-100 p-1.5 text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-[var(--portal-title,#0b1739)]">
                Key Takeaways
              </h3>
            </div>

            <ul className="mt-3.5 space-y-3 text-xs text-[var(--portal-ink,#1f2937)]">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 font-bold text-emerald-600">✓</span>
                <span>Reports show the direct results of your team&apos;s round decisions.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 font-bold text-emerald-600">✓</span>
                <span>Use reports to identify workforce strengths, weaknesses, and opportunities.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 font-bold text-emerald-600">✓</span>
                <span>Review reports every round to track performance trends and improvement.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 font-bold text-emerald-600">✓</span>
                <span>Results help you make stronger, strategy-aligned decisions in future rounds.</span>
              </li>
            </ul>
          </div>

          {/* Quick Links Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="rounded-lg bg-blue-100 p-1.5 text-blue-700">
                <ExternalLink className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-[var(--portal-title,#0b1739)]">
                Quick Links
              </h3>
            </div>

            <div className="mt-3 space-y-1">
              {QUICK_GUIDES.map((guide) => (
                <button
                  key={guide.id}
                  onClick={() => setActiveQuickGuide(guide)}
                  className="flex w-full items-center justify-between rounded-lg p-2 text-left text-xs font-medium text-[var(--portal-ink,#1f2937)] hover:bg-slate-50 hover:text-[var(--portal-primary,#1d6ef5)] transition-colors group"
                >
                  <span>{guide.question}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 group-hover:text-[var(--portal-primary,#1d6ef5)] transition-all" />
                </button>
              ))}
            </div>
          </div>

          {/* Tip Card */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 shadow-xs">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <Lightbulb className="h-4 w-4 text-amber-600" />
              <span>Pro Tip</span>
            </div>
            <p className="mt-1.5 leading-relaxed">
              Visit the{" "}
              <Link
                href="/resources/metrics"
                className="font-semibold text-amber-900 underline hover:text-amber-950"
              >
                HR Metrics Reference in Resources
              </Link>{" "}
              to learn more about how specific formulas, productivity indices, and scorecard metrics are computed.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Notice */}
      <footer className="mt-12 border-t border-slate-200 pt-6 text-center text-xs text-slate-500">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
            Your privacy and data security are important to us.
          </span>
          <span>|</span>
          <span>&copy; 2025 Forio Online, LLC. All rights reserved.</span>
          <span>|</span>
          <Link href="#" className="hover:underline">
            Privacy Policy
          </Link>
          <span>|</span>
          <Link href="#" className="hover:underline">
            Terms of Use
          </Link>
        </div>
      </footer>

      {/* Interactive Topic Modal */}
      {selectedTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <button
              onClick={() => setSelectedTopic(null)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--portal-primary,#1d6ef5)]">
              <span>Topic {selectedTopic.number}</span>
              <span>•</span>
              <span className="capitalize">{selectedTopic.category}</span>
            </div>

            <h3 className="mt-2 text-xl font-bold text-[var(--portal-title,#0b1739)]">
              {selectedTopic.number}. {selectedTopic.title}
            </h3>

            <p className="mt-3 text-sm leading-relaxed text-[var(--portal-ink,#1f2937)]">
              {selectedTopic.details.overview}
            </p>

            <div className="mt-4 rounded-xl bg-slate-50 p-4 border border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Key Highlights
              </h4>
              <ul className="mt-2 space-y-2 text-xs text-slate-700">
                {selectedTopic.details.keyPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="font-bold text-[var(--portal-primary,#1d6ef5)]">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-900 border border-amber-200 flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Recommendation: </span>
                {selectedTopic.details.proTip}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
              <button
                onClick={() => setSelectedTopic(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>

              {selectedTopic.details.actionLink && (
                <Link
                  href={selectedTopic.details.actionLink.href}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--portal-brand,#ff5a1f)] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[var(--portal-brand-hover,#e84e14)]"
                >
                  {selectedTopic.details.actionLink.label}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Quick Guide Modal */}
      {activeQuickGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <button
              onClick={() => setActiveQuickGuide(null)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600">
              <HelpCircle className="h-4 w-4" />
              <span>Quick Guide</span>
            </div>

            <h3 className="mt-2 text-lg font-bold text-[var(--portal-title,#0b1739)]">
              {activeQuickGuide.question}
            </h3>

            <p className="mt-3 text-xs leading-relaxed text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100">
              {activeQuickGuide.answer}
            </p>

            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
              <button
                onClick={() => setActiveQuickGuide(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>

              <Link
                href={activeQuickGuide.linkHref}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--portal-primary,#1d6ef5)] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[var(--portal-primary-hover,#1558d6)]"
              >
                {activeQuickGuide.linkText}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BarChartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  );
}
