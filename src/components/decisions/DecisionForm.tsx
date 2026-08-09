"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Accessibility,
  Award,
  BookOpen,
  Building2,
  CalendarRange,
  CircleHelp,
  ClipboardCheck,
  Coins,
  Gift,
  GitBranch,
  GraduationCap,
  Handshake,
  HeartHandshake,
  Home,
  Landmark,
  Megaphone,
  MessageSquareText,
  Monitor,
  Network,
  Percent,
  RefreshCw,
  Scale,
  Smile,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  UsersRound,
  Wallet,
} from "lucide-react";
import { BudgetTracker } from "@/components/dashboard/BudgetTracker";
import { Button } from "@/components/ui/button";
import { formInputClassName, formSelectClassName } from "@/components/ui/form-controls";
import {
  getIndustryConfig,
  getStrategyConfig,
  priorStateFromIndustry,
} from "@/lib/engine/config";
import { createDefaultDecision } from "@/lib/engine/defaults";
import { runSimulation } from "@/lib/engine/engine";
import { computeBudgetBreakdown, computeRecruitmentCost } from "@/lib/engine/budget";
import {
  computeCostPerHire,
  computeReviewCoverage,
  computeTimeToFill,
} from "@/lib/engine/metrics";
import { generateWarnings } from "@/lib/engine/validation";
import {
  CHANGE_MGMT_COST,
  COLLABORATION_COST,
  CONFLICT_CONFIG,
  DEI_LEVEL_COST,
  DEVELOPMENTAL_PROGRAMS,
  INVESTMENT_LEVELS,
  PROGRAM_COSTS,
} from "@/lib/engine/programs";
import {
  avgPerformanceCriteria,
  getRoleById,
  ROLE_GROUPS,
} from "@/lib/engine/roles";
import type {
  CollaborationEnablement,
  ConflictApproach,
  Decision,
  DevelopmentalProgram,
  EconomyCondition,
  Industry,
  InvestmentLevel,
  OrganizationalStructure,
  PositionToFill,
  ProcessFocus,
  SalaryBand,
  Strategy,
} from "@/lib/engine/types";
import { CompensationBreakdown } from "@/components/decisions/CompensationBreakdown";
import {
  DecisionStatusStrip,
  DecisionStickyFooter,
} from "@/components/decisions/DecisionChrome";
import { DecisionGuidance } from "@/components/decisions/DecisionGuidance";
import { MetricPreview } from "@/components/decisions/MetricPreview";
import { ScaffoldingText } from "@/components/decisions/ScaffoldingText";
import { BSCScorecard } from "@/components/results/BSCScorecard";
import { deriveTrainingBudgetPerEe } from "@/lib/engine/training";
import { markModuleVisited } from "@/lib/student/module-progress";
import { useSimulationConfig } from "@/hooks/useSimulationConfig";
import { formatCurrency } from "@/lib/utils";
import { totalHires } from "@/lib/engine/roles";

const MODULES = [
  "Recruitment",
  "Performance",
  "Training",
  "Relations",
  "Compensation",
  "Org Design",
  "DEI",
] as const;

const MODULE_LABELS: Record<(typeof MODULES)[number], string> = {
  Recruitment: "Recruitment & Selection",
  Performance: "Performance Management",
  Training: "Training & Development",
  Relations: "Employee Relations",
  Compensation: "Compensation & Benefits",
  "Org Design": "Org Design & Change",
  DEI: "DEI Initiatives",
};

const SHRM_BADGES: Record<string, string> = {
  Recruitment: "Talent Acquisition",
  Performance: "Performance Management",
  Training: "Learning & Development",
  Relations: "Employee & Labor Relations",
  Compensation: "Total Rewards",
  "Org Design": "Organization",
  DEI: "Diversity, Equity & Inclusion",
};

const ORG_STRUCTURES: OrganizationalStructure[] = [
  "Functional",
  "Divisional",
  "Matrix",
  "Team-Based",
  "Flat",
];

const PROCESS_FOCUS_OPTIONS: ProcessFocus[] = [
  "Efficiency",
  "Quality",
  "Innovation",
  "Customer Responsiveness",
  "Agility",
];

const COLLABORATION_OPTIONS: CollaborationEnablement[] = [
  "Limited",
  "Standard",
  "Enhanced",
  "Highly Integrated",
];

const STRUCTURE_CUES: Record<OrganizationalStructure, string> = {
  Functional:
    "Functional structures can support efficiency and specialization but may reduce cross-functional coordination.",
  Divisional:
    "Divisional structures can improve market or product accountability but may duplicate functions.",
  Matrix:
    "Matrix structures can strengthen cross-functional integration but may introduce role ambiguity.",
  "Team-Based":
    "Team-based structures can increase collaboration and adaptability but may reduce clear hierarchical accountability.",
  Flat: "Flat structures can speed decisions and empower employees but may stretch managerial capacity.",
};

const SALARY_BAND_OPTIONS: { value: SalaryBand; label: string }[] = [
  { value: -20, label: "20% below market" },
  { value: -10, label: "10% below market" },
  { value: 0, label: "At market" },
  { value: 10, label: "10% above market" },
  { value: 20, label: "20% above market" },
];

const REVIEW_FREQ_COST: Record<1 | 2 | 4, number> = { 1: 0, 2: 3000, 4: 6000 };

const PERF_CRITERIA = [
  {
    key: "productivity" as const,
    label: "Productivity",
    headerClass: "text-emerald-700",
    iconWrap: "bg-emerald-50 text-emerald-600",
    accent: "accent-emerald-600",
  },
  {
    key: "teamwork" as const,
    label: "Teamwork",
    headerClass: "text-[var(--portal-accent-blue)]",
    iconWrap: "bg-blue-50 text-[var(--portal-accent-blue)]",
    accent: "accent-[var(--portal-accent-blue)]",
  },
  {
    key: "leadership" as const,
    label: "Leadership",
    headerClass: "text-[var(--portal-icon-orange)]",
    iconWrap: "bg-orange-50 text-[var(--portal-icon-orange)]",
    accent: "accent-[var(--portal-brand)]",
  },
  {
    key: "communication" as const,
    label: "Communication",
    headerClass: "text-[var(--portal-icon-purple)]",
    iconWrap: "bg-violet-50 text-[var(--portal-icon-purple)]",
    accent: "accent-[var(--portal-icon-purple)]",
  },
];

function formatSigned(value: number, suffix: string, digits = 1): string {
  const abs = Math.abs(value).toFixed(digits);
  if (value > 0.05) return `+${abs}${suffix}`;
  if (value < -0.05) return `−${abs}${suffix}`;
  return `0${suffix}`;
}

function reviewPracticeHint(freq: 1 | 2 | 4, industry: Industry): string {
  if (freq === 2) {
    return `Semi-annual reviews are common in ${industry} and balance accountability with operational cadence.`;
  }
  if (freq === 1) {
    return `Annual reviews keep process cost low but may reduce coaching frequency versus typical ${industry} practice.`;
  }
  return `Quarterly reviews increase coverage and coaching touchpoints, with higher process cost for ${industry}.`;
}

const CONFLICT_LABELS: Record<ConflictApproach, string> = {
  mediation: "Mediation",
  disciplinary: "Disciplinary",
  coaching: "Coaching",
};

const CONFLICT_HINTS: Record<ConflictApproach, string> = {
  mediation:
    "Mediation promotes constructive dialogue and early resolution at a moderate cost.",
  disciplinary:
    "Disciplinary approaches can restore order quickly but may reduce trust and engagement.",
  coaching:
    "Coaching invests in lasting behavior change and higher engagement at a higher cost.",
};

const FLEXIBILITY_HINTS: Record<0 | 1 | 2, string> = {
  0: "No formal flexibility. Predictable schedules, but may limit attraction and retention.",
  1: "Flexible models can increase engagement and reduce turnover, but may have productivity trade-offs.",
  2: "Full flexibility maximizes autonomy and attraction, with greater coordination risk.",
};

const VOICE_HINTS: Record<0 | 1 | 2, string> = {
  0: "No formal voice channels. Feedback relies on informal manager conversations.",
  1: "Annual survey and suggestion box. Limited real-time feedback opportunities.",
  2: "Continuous listening, forums, and representative councils for richer employee voice.",
};

const PROCESS_FOCUS_HINTS: Record<ProcessFocus, string> = {
  Efficiency: "Prioritizes throughput and cost discipline across workflows.",
  Quality: "Emphasizes standards, defect reduction, and consistent delivery.",
  Innovation: "Encourages experimentation and new capability building.",
  "Customer Responsiveness":
    "Aligns teams around speed and quality of customer response.",
  Agility: "Optimizes for rapid reconfiguration as conditions change.",
};

const COLLABORATION_HINTS: Record<CollaborationEnablement, string> = {
  Limited: "Minimal cross-team tooling — silos may persist.",
  Standard: "Baseline collaboration tools and rituals across teams.",
  Enhanced: "Stronger shared platforms and cross-functional forums.",
  "Highly Integrated":
    "Deep integration of workflows, data, and decision rights across units.",
};

const CHANGE_MGMT_HINTS: Record<InvestmentLevel, string> = {
  Minimal: "Change relies on informal communication with limited support capacity.",
  Basic: "Light change support — enough for small initiatives.",
  Moderate: "Structured change capability for typical transformation waves.",
  Strong: "Dedicated change resources and sponsorship for major shifts.",
  Advanced: "Enterprise-grade change capability with continuous readiness.",
};

const DEI_CARDS = [
  {
    key: "dei_diverse_recruitment" as const,
    label: "Diverse Recruitment & Talent Pipelines",
    cue: "Stronger pipelines help attract diverse talent and improve representation over time.",
    accent: "emerald" as const,
    icon: UsersRound,
  },
  {
    key: "dei_equity_practices" as const,
    label: "Equity Practices",
    cue: "Equitable practices build trust, reduce bias, and support employee satisfaction.",
    accent: "blue" as const,
    icon: Scale,
  },
  {
    key: "dei_inclusion_initiatives" as const,
    label: "Inclusion Initiatives",
    cue: "Inclusive environments increase engagement, belonging, and retention.",
    accent: "violet" as const,
    icon: HeartHandshake,
  },
  {
    key: "dei_training_education" as const,
    label: "Training & Education",
    cue: "Training builds capability, reduces bias, and strengthens inclusive leadership.",
    accent: "orange" as const,
    icon: GraduationCap,
  },
  {
    key: "dei_accessibility_support" as const,
    label: "Accessibility & Support",
    cue: "Accessibility and support ensure all employees can contribute and belong.",
    accent: "teal" as const,
    icon: Accessibility,
  },
];

const PROGRAM_ICONS: Record<
  DevelopmentalProgram,
  typeof GraduationCap
> = {
  "Leadership Development": GraduationCap,
  "Time Management": BookOpen,
  "Managerial Skills": Users,
  "Technical Skills": Network,
  Compliance: Scale,
  "Project Management": Target,
};

const CARD_ACCENT = {
  emerald: {
    border: "border-emerald-200/80",
    title: "text-emerald-700",
    iconWrap: "bg-emerald-50 text-emerald-600",
    footer: "bg-emerald-50 text-emerald-950",
  },
  blue: {
    border: "border-blue-200/80",
    title: "text-[var(--portal-accent-blue)]",
    iconWrap: "bg-blue-50 text-[var(--portal-accent-blue)]",
    footer: "bg-[var(--portal-accent-blue-soft)] text-[var(--portal-title)]",
  },
  violet: {
    border: "border-violet-200/80",
    title: "text-[var(--portal-icon-purple)]",
    iconWrap: "bg-violet-50 text-[var(--portal-icon-purple)]",
    footer: "bg-violet-50 text-[var(--portal-title)]",
  },
  orange: {
    border: "border-orange-200/70",
    title: "text-[var(--portal-icon-orange)]",
    iconWrap: "bg-orange-50 text-[var(--portal-icon-orange)]",
    footer: "bg-orange-50 text-[var(--portal-title)]",
  },
  teal: {
    border: "border-teal-200/80",
    title: "text-teal-700",
    iconWrap: "bg-teal-50 text-teal-700",
    footer: "bg-teal-50 text-teal-900",
  },
} as const;

interface DecisionFormProps {
  industry: Industry;
  strategy: Strategy;
  economy?: EconomyCondition;
  controlledDecision?: Decision;
  onDecisionChange?: (d: Decision) => void;
  hideRunButton?: boolean;
  /** Round context for PNG status strip */
  roundNumber?: number;
  roundOpen?: boolean;
  roundId?: string;
  saving?: boolean;
  onSaveNow?: () => void;
  onSaveAndContinue?: () => void;
}

export function DecisionForm(props: DecisionFormProps) {
  return (
    <Suspense
      fallback={
        <p className="p-4 text-sm text-[var(--portal-muted)]">Loading decision form…</p>
      }
    >
      <DecisionFormInner {...props} />
    </Suspense>
  );
}

function DecisionFormInner({
  industry,
  strategy,
  economy = "normal",
  controlledDecision,
  onDecisionChange,
  hideRunButton = false,
  roundNumber,
  roundOpen = true,
  roundId,
  saving,
  onSaveNow,
  onSaveAndContinue,
}: DecisionFormProps) {
  const { ready: configReady } = useSimulationConfig();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(0);

  const TAB_KEYS = [
    "recruitment",
    "performance",
    "training",
    "relations",
    "compensation",
    "org-design",
    "dei",
  ] as const;

  // Deep-link from Capsim-style sidebar: ?tab=recruitment|performance|...
  useEffect(() => {
    const tab = searchParams.get("tab");
    const idx = TAB_KEYS.indexOf(tab as (typeof TAB_KEYS)[number]);
    if (idx >= 0) setActiveTab(idx);
  }, [searchParams]);

  useEffect(() => {
    if (!roundId) return;
    markModuleVisited(roundId, TAB_KEYS[activeTab] ?? "recruitment");
  }, [roundId, activeTab]);

  const nextLabel =
    activeTab < MODULES.length - 1
      ? `Save & Continue → ${MODULE_LABELS[MODULES[activeTab + 1]]}`
      : "Save & Continue → Review & Submit";

  const [internalDecision, setInternalDecision] = useState<Decision>(() =>
    createDefaultDecision()
  );
  const [showResults, setShowResults] = useState(false);

  const decision = controlledDecision ?? internalDecision;
  const industryConfig = getIndustryConfig(industry);
  const strategyConfig = getStrategyConfig(strategy);
  const prior = priorStateFromIndustry(industry);

  const budget = useMemo(
    () =>
      computeBudgetBreakdown(
        decision,
        prior.headcount,
        industryConfig.base_market_salary,
        industryConfig
      ),
    [decision, prior.headcount, industryConfig, configReady]
  );

  const activeModuleSpend = [
    budget.recruitment_spend,
    budget.performance_spend,
    budget.training_spend,
    budget.relations_spend,
    budget.compensation_spend,
    budget.org_design_spend,
    budget.dei_spend,
  ][activeTab] ?? 0;

  const warnings = useMemo(
    () =>
      generateWarnings(
        decision,
        prior.headcount,
        industryConfig.base_market_salary,
        industryConfig,
        industry
      ),
    [decision, prior.headcount, industryConfig, industry, configReady]
  );

  const activeModule = MODULES[activeTab];
  const yourInvestmentPct = useMemo(() => {
    return (activeModuleSpend / Math.max(1, budget.available_budget)) * 100;
  }, [activeModuleSpend, budget.available_budget]);

  const derivedTrainingPerEe = useMemo(
    () => deriveTrainingBudgetPerEe(decision),
    [decision]
  );

  const liveMetrics = useMemo(() => {
    const avgProd = avgPerformanceCriteria(
      decision.role_performance,
      "productivity"
    );
    const avgLead = avgPerformanceCriteria(
      decision.role_performance,
      "leadership"
    );
    const systemCost =
      REVIEW_FREQ_COST[decision.review_frequency] +
      (decision.feedback_360 ? 8000 : 0);
    const productivityImpact =
      (avgProd - 5) * 0.55 +
      (decision.feedback_360 ? 0.45 : 0) +
      ({ 1: 0, 2: 0.35, 4: 0.7 } as const)[decision.review_frequency];
    const leadershipImpact =
      (avgLead - 5) * 1.35 +
      (decision.feedback_360 ? 1.6 : 0) +
      ({ 1: 0, 2: 0.4, 4: 0.9 } as const)[decision.review_frequency];

    const trainingParticipants =
      prior.headcount * (decision.pct_employees_trained / 100);
    const learningImpact =
      decision.developmental_programs.length * 2.2 +
      decision.pct_employees_trained * 0.12 +
      decision.succession_investment / 2500;
    const trainingProdImpact =
      decision.developmental_programs.length * 0.55 +
      decision.pct_employees_trained * 0.04;
    const employeeDevelopment = Math.min(
      95,
      40 +
        decision.developmental_programs.length * 8 +
        decision.pct_employees_trained * 0.55 +
        decision.succession_investment / 800
    );

    const conflict = CONFLICT_CONFIG[decision.conflict_approach];
    const satisfactionImpact =
      conflict.satisfaction_impact * 0.9 +
      decision.engagement_investment / 2200 +
      decision.voice_mechanisms * 1.4 +
      decision.flexibility_level * 0.8;
    const engagementImpact =
      conflict.engagement_impact * 0.85 +
      decision.engagement_investment / 1800 +
      decision.flexibility_level * 1.2 +
      decision.voice_mechanisms * 1.1;
    const absenteeismImpact = -(
      decision.engagement_investment / 6000 +
      decision.flexibility_level * 0.35 +
      decision.voice_mechanisms * 0.25
    );
    const relationsDeiImpact =
      decision.voice_mechanisms * 1.4 +
      decision.flexibility_level * 0.9 +
      conflict.satisfaction_impact * 0.35;

    const avgBand =
      decision.role_compensation.reduce((s, r) => s + r.salary_band, 0) /
      Math.max(1, decision.role_compensation.length);
    const turnoverImpact =
      avgBand * -0.08 +
      (decision.benefits_pct - 10) * -0.12 +
      (decision.bonus_tier - 5) * -0.15 +
      decision.equity_level * -0.6;
    const retentionImpact =
      avgBand * 0.1 +
      (decision.benefits_pct - 10) * 0.18 +
      (decision.bonus_tier - 5) * 0.2 +
      decision.equity_level * 0.9;
    const motivationImpact =
      avgBand * 0.08 +
      (decision.benefits_pct - 10) * 0.12 +
      decision.bonus_tier * 0.12 +
      decision.equity_level * 0.7;
    const financialImpact = -(
      budget.compensation_spend * 0.15 +
      decision.hr_tech_level * 7500
    );

    const spanMid = 6;
    const efficiencyImpact =
      (decision.process_focus === "Efficiency" ? 1.4 : 0.4) +
      (spanMid - Math.abs(decision.span_of_control - spanMid)) * 0.25 +
      (decision.organizational_structure === "Functional" ? 0.6 : 0.2);
    const agilityImpact =
      (decision.process_focus === "Agility" ? 1.6 : 0.5) +
      ({ Flat: 1.2, "Team-Based": 1.0, Matrix: 0.7, Divisional: 0.4, Functional: 0.2 }[
        decision.organizational_structure
      ] ?? 0.4) +
      decision.span_of_control * 0.08;
    const collaborationImpact =
      ({
        Limited: 0.4,
        Standard: 1.2,
        Enhanced: 2.2,
        "Highly Integrated": 3.2,
      }[decision.collaboration_enablement] ?? 1) +
      (decision.organizational_structure === "Matrix" ||
      decision.organizational_structure === "Team-Based"
        ? 0.8
        : 0.2);
    const changeReadinessImpact =
      ({
        Minimal: 0.4,
        Basic: 1.2,
        Moderate: 2.2,
        Strong: 3.2,
        Advanced: 4.2,
      }[decision.change_management_capability] ?? 1) +
      (decision.process_focus === "Innovation" ||
      decision.process_focus === "Agility"
        ? 0.6
        : 0.2);

    const deiLevelScore = (level: InvestmentLevel) =>
      ({ Minimal: 0, Basic: 0.8, Moderate: 1.6, Strong: 2.5, Advanced: 3.4 })[
        level
      ] ?? 0;
    const talentAttractionImpact =
      deiLevelScore(decision.dei_diverse_recruitment) * 1.1 +
      deiLevelScore(decision.dei_inclusion_initiatives) * 0.4;
    const employeeExperienceImpact =
      deiLevelScore(decision.dei_inclusion_initiatives) * 1.1 +
      deiLevelScore(decision.dei_equity_practices) * 0.7 +
      deiLevelScore(decision.dei_accessibility_support) * 0.5;
    const deiRetentionImpact =
      deiLevelScore(decision.dei_equity_practices) * 0.8 +
      deiLevelScore(decision.dei_inclusion_initiatives) * 0.6 +
      deiLevelScore(decision.dei_accessibility_support) * 0.4;
    const innovationImpact =
      deiLevelScore(decision.dei_training_education) * 0.9 +
      deiLevelScore(decision.dei_diverse_recruitment) * 0.6 +
      deiLevelScore(decision.dei_inclusion_initiatives) * 0.5;

    return {
      costPerHire: computeCostPerHire(decision, industryConfig),
      timeToFill: computeTimeToFill(decision),
      recruitmentCost: computeRecruitmentCost(decision, industryConfig),
      reviewCoverage: computeReviewCoverage(decision),
      productivityImpact,
      leadershipImpact,
      performanceSystemCost: systemCost,
      learningImpact,
      trainingProdImpact,
      employeeDevelopment,
      trainingSpend: budget.training_spend,
      trainingParticipants,
      satisfactionImpact,
      engagementImpact,
      absenteeismImpact,
      relationsDeiImpact,
      turnoverImpact,
      retentionImpact,
      motivationImpact,
      financialImpact,
      efficiencyImpact,
      agilityImpact,
      collaborationImpact,
      changeReadinessImpact,
      talentAttractionImpact,
      employeeExperienceImpact,
      deiRetentionImpact,
      innovationImpact,
    };
  }, [decision, industryConfig, prior.headcount, budget.training_spend, budget.compensation_spend]);

  const outcome = useMemo(() => {
    if (!showResults) return null;
    return runSimulation(
      decision,
      prior,
      industryConfig,
      strategyConfig,
      economy
    );
  }, [showResults, decision, prior, industryConfig, strategyConfig, economy]);

  function update<K extends keyof Decision>(key: K, value: Decision[K]) {
    const next = { ...decision, [key]: value };
    if (onDecisionChange) onDecisionChange(next);
    else setInternalDecision(next);
    setShowResults(false);
  }

  function updatePosition(roleId: string, count: number) {
    const existing = decision.positions_to_fill.find((p) => p.role_id === roleId);
    let next: PositionToFill[];
    if (existing) {
      next = decision.positions_to_fill.map((p) =>
        p.role_id === roleId ? { ...p, count: Math.max(0, count) } : p
      );
    } else {
      next = [...decision.positions_to_fill, { role_id: roleId, count }];
    }
    update("positions_to_fill", next.filter((p) => p.count > 0));
  }

  function positionCount(roleId: string): number {
    return decision.positions_to_fill.find((p) => p.role_id === roleId)?.count ?? 0;
  }

  const trainingEstParticipants = Math.max(
    0,
    Math.round(prior.headcount * (decision.pct_employees_trained / 100))
  );

  function programParticipantCount(prog: DevelopmentalProgram): number {
    return decision.developmental_programs.includes(prog)
      ? Math.max(1, trainingEstParticipants)
      : 0;
  }

  function setProgramParticipants(prog: DevelopmentalProgram, next: number) {
    const included = decision.developmental_programs.includes(prog);
    if (next <= 0) {
      if (included) {
        update(
          "developmental_programs",
          decision.developmental_programs.filter((p) => p !== prog)
        );
      }
      return;
    }
    if (!included) {
      update("developmental_programs", [
        ...decision.developmental_programs,
        prog,
      ]);
    }
  }

  const hireTotal = totalHires(decision.positions_to_fill);
  const economyLabel =
    economy.charAt(0).toUpperCase() + economy.slice(1);
  const roundLabel =
    roundNumber != null ? `Round ${roundNumber}` : "Current Round";

  const screeningHint =
    decision.screening_rigor === 1
      ? "Faster hiring with lighter screening. Quality risk may rise."
      : decision.screening_rigor === 2
        ? "More rigorous selection may require additional time and resources."
        : "Highest rigor with full panel evaluation — stronger quality, longer fill times.";

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-4 pb-24">
      {!configReady && (
        <p className="text-xs text-[var(--portal-muted)]">Loading simulation parameters…</p>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-[28px] font-bold leading-tight text-[var(--portal-title)]">
            {MODULE_LABELS[MODULES[activeTab]]}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[var(--portal-brand)]/35 bg-[var(--portal-brand-soft)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--portal-brand)]">
              SHRM BASK
            </span>
            <span className="rounded-full bg-[var(--portal-brand)] px-2.5 py-0.5 text-[11px] font-semibold text-white">
              {SHRM_BADGES[MODULES[activeTab]]}
            </span>
          </div>
          <ScaffoldingText module={MODULES[activeTab]} />
        </div>
        <DecisionStatusStrip
          roundLabel={roundLabel}
          roundOpen={roundOpen}
          industry={industry}
          strategy={strategy}
          economy={economyLabel}
          moduleIndex={activeTab + 1}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0 space-y-4">
        <BudgetTracker budget={budget} />

        {activeTab === 0 && (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <section className="flex flex-col rounded-xl border border-emerald-200/80 bg-white p-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
                <div className="flex items-start gap-2.5">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <Users className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-700">1. Hiring Needs</h3>
                    <p className="mt-0.5 text-[11px] leading-snug text-[var(--portal-muted)]">
                      Employees to hire by role group
                    </p>
                  </div>
                </div>
                <ul className="mt-3 flex-1 space-y-2">
                  {ROLE_GROUPS.map((role) => (
                    <li
                      key={role.id}
                      className="flex items-center justify-between gap-2 text-[13px]"
                    >
                      <span className="min-w-0 truncate font-medium text-[var(--portal-ink)]">
                        {role.label}
                      </span>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          className="h-7 w-7 rounded-md border border-[var(--portal-sidebar-border)] text-sm font-bold text-[var(--portal-ink)] hover:bg-[#f4f5f7]"
                          onClick={() =>
                            updatePosition(role.id, Math.max(0, positionCount(role.id) - 1))
                          }
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm font-semibold tabular-nums">
                          {positionCount(role.id)}
                        </span>
                        <button
                          type="button"
                          className="h-7 w-7 rounded-md border border-[var(--portal-sidebar-border)] text-sm font-bold text-[var(--portal-ink)] hover:bg-[#f4f5f7]"
                          onClick={() =>
                            updatePosition(role.id, Math.min(20, positionCount(role.id) + 1))
                          }
                        >
                          +
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 border-t border-emerald-100 pt-2.5 text-[12px] font-bold uppercase tracking-wide text-emerald-700">
                  Total New Hires{" "}
                  <span className="ml-1 text-base tabular-nums">{hireTotal}</span>
                </p>
              </section>

              <section className="flex flex-col rounded-xl border border-blue-200/80 bg-white p-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
                <div className="flex items-start gap-2.5">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[var(--portal-accent-blue)]">
                    <CircleHelp className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--portal-accent-blue)]">
                      2. Selection Approach
                    </h3>
                    <p className="mt-0.5 text-[11px] leading-snug text-[var(--portal-muted)]">
                      Screening rigor for new hires
                    </p>
                  </div>
                </div>
                <label className="mt-4 block text-[11px] font-semibold text-[var(--portal-ink)]">
                  Screening Rigor
                  <select
                    className={`mt-1.5 ${formSelectClassName}`}
                    value={decision.screening_rigor}
                    onChange={(e) =>
                      update("screening_rigor", Number(e.target.value) as 1 | 2 | 3)
                    }
                  >
                    <option value={1}>Basic</option>
                    <option value={2}>Assessment + Interview</option>
                    <option value={3}>Full Panel</option>
                  </select>
                </label>
                <p className="mt-auto rounded-lg bg-[var(--portal-accent-blue-soft)] px-2.5 py-2 pt-2 text-[11px] leading-snug text-[var(--portal-title)]">
                  {screeningHint}
                </p>
              </section>

              <section className="flex flex-col rounded-xl border border-violet-200/80 bg-white p-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
                <div className="flex items-start gap-2.5">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-50 text-[var(--portal-icon-purple)]">
                    <UsersRound className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--portal-icon-purple)]">
                      3. Diversity Sourcing Goal
                    </h3>
                    <p className="mt-0.5 text-[11px] leading-snug text-[var(--portal-muted)]">
                      Target diverse candidate share
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[11px] font-semibold text-[var(--portal-ink)]">
                      Diversity Sourcing Goal
                    </span>
                    <span className="text-2xl font-bold tabular-nums text-[var(--portal-icon-purple)]">
                      {decision.diversity_goal_pct}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    className="mt-3 w-full accent-[var(--portal-icon-purple)]"
                    value={decision.diversity_goal_pct}
                    onChange={(e) =>
                      update("diversity_goal_pct", Number(e.target.value))
                    }
                  />
                  <div className="mt-1 flex justify-between text-[10px] text-[var(--portal-muted)]">
                    <span>0%</span>
                    <span>50%</span>
                  </div>
                </div>
                <p className="mt-auto rounded-lg bg-violet-50 px-2.5 py-2 text-[11px] leading-snug text-[var(--portal-title)]">
                  Investing in diverse sourcing expands the talent pool and can
                  strengthen long-term DEI outcomes.
                </p>
              </section>

              <section className="flex flex-col rounded-xl border border-teal-200/80 bg-white p-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
                <div className="flex items-start gap-2.5">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                    <Handshake className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-teal-700">
                      4. Onboarding Investment
                    </h3>
                    <p className="mt-0.5 text-[11px] leading-snug text-[var(--portal-muted)]">
                      Dollars per new hire
                    </p>
                  </div>
                </div>
                <label className="mt-4 block text-[11px] font-semibold text-[var(--portal-ink)]">
                  Onboarding Investment (per hire)
                  <div className="mt-1.5 flex items-center gap-2">
                    <button
                      type="button"
                      className="h-8 w-8 rounded-md border border-[var(--portal-sidebar-border)] font-bold hover:bg-[#f4f5f7]"
                      onClick={() =>
                        update(
                          "onboarding_investment",
                          Math.max(0, decision.onboarding_investment - 100)
                        )
                      }
                    >
                      −
                    </button>
                    <input
                      type="number"
                      className={`w-full ${formInputClassName}`}
                      value={decision.onboarding_investment}
                      onChange={(e) =>
                        update("onboarding_investment", Number(e.target.value))
                      }
                    />
                    <button
                      type="button"
                      className="h-8 w-8 rounded-md border border-[var(--portal-sidebar-border)] font-bold hover:bg-[#f4f5f7]"
                      onClick={() =>
                        update(
                          "onboarding_investment",
                          decision.onboarding_investment + 100
                        )
                      }
                    >
                      +
                    </button>
                  </div>
                </label>
                <p className="mt-auto rounded-lg bg-teal-50 px-2.5 py-2 text-[11px] font-medium leading-snug text-teal-900">
                  {hireTotal} New Hires × {formatCurrency(decision.onboarding_investment)}{" "}
                  = {formatCurrency(hireTotal * decision.onboarding_investment)}{" "}
                  Estimated Onboarding Investment
                </p>
              </section>
            </div>

            <MetricPreview
              showCalcLink
              calcTitle="Estimates update live from your hiring plan, screening rigor, diversity sourcing, and onboarding spend."
              items={[
                {
                  label: "Total Recruitment Cost",
                  value: formatCurrency(liveMetrics.recruitmentCost),
                },
                {
                  label: "Cost Per Hire",
                  value: formatCurrency(liveMetrics.costPerHire),
                },
                {
                  label: "Estimated Time to Fill",
                  value: `${liveMetrics.timeToFill.toFixed(0)} Days`,
                },
              ]}
            />
          </div>
        )}

        {activeTab === 1 && (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <section className="flex flex-col rounded-xl border border-emerald-200/80 bg-white p-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
                <div className="flex items-start gap-2.5">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <CalendarRange className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-700">
                      1. Review Cadence
                    </h3>
                    <p className="mt-0.5 text-[11px] leading-snug text-[var(--portal-muted)]">
                      How often formal reviews occur
                    </p>
                  </div>
                </div>
                <label className="mt-4 block text-[11px] font-semibold text-[var(--portal-ink)]">
                  Review Frequency
                  <select
                    className={`mt-1.5 ${formSelectClassName}`}
                    value={decision.review_frequency}
                    onChange={(e) =>
                      update(
                        "review_frequency",
                        Number(e.target.value) as 1 | 2 | 4
                      )
                    }
                  >
                    <option value={1}>Annual</option>
                    <option value={2}>Semi-annual</option>
                    <option value={4}>Quarterly</option>
                  </select>
                </label>
                <div className="mt-auto rounded-lg bg-emerald-50 px-2.5 py-2 text-[11px] leading-snug text-emerald-950">
                  <p className="font-bold text-emerald-800">Industry Practice</p>
                  <p className="mt-0.5 font-medium">
                    {reviewPracticeHint(decision.review_frequency, industry)}
                  </p>
                </div>
              </section>

              <section className="flex flex-col rounded-xl border border-blue-200/80 bg-white p-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
                <div className="flex items-start gap-2.5">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[var(--portal-accent-blue)]">
                    <MessageSquareText className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--portal-accent-blue)]">
                      2. 360° Feedback
                    </h3>
                    <p className="mt-0.5 text-[11px] leading-snug text-[var(--portal-muted)]">
                      Multi-rater leadership assessment
                    </p>
                  </div>
                </div>
                <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-lg border border-[var(--portal-sidebar-border)] bg-[var(--portal-page)] px-3 py-2.5">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-[var(--portal-accent-blue)]"
                    checked={decision.feedback_360}
                    onChange={(e) => update("feedback_360", e.target.checked)}
                  />
                  <span>
                    <span className="block text-[13px] font-semibold text-[var(--portal-ink)]">
                      Enable ($8,000 / year)
                    </span>
                    <span className="mt-0.5 block text-[11px] text-[var(--portal-muted)]">
                      Adds multi-source feedback into the review cycle
                    </span>
                  </span>
                </label>
                <p className="mt-auto rounded-lg bg-[var(--portal-accent-blue-soft)] px-2.5 py-2 text-[11px] leading-snug text-[var(--portal-title)]">
                  360° feedback strengthens leadership assessment and development
                  conversations across role groups.
                </p>
              </section>
            </div>

            <section className="rounded-xl border border-orange-200/70 bg-white p-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
              <div className="flex items-start gap-2.5">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-50 text-[var(--portal-icon-orange)]">
                  <ClipboardCheck className="h-4 w-4" strokeWidth={2.25} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-[var(--portal-icon-orange)]">
                    3. Performance Criteria by Role Group
                  </h3>
                  <p className="mt-0.5 text-[11px] leading-snug text-[var(--portal-muted)]">
                    Set importance (1–10) for each evaluation dimension
                  </p>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[640px] border-separate border-spacing-y-2">
                  <thead>
                    <tr>
                      <th className="px-2 pb-1 text-left text-[10px] font-bold uppercase tracking-wide text-[var(--portal-muted)]">
                        Role Group
                      </th>
                      {PERF_CRITERIA.map((dim) => (
                        <th key={dim.key} className="px-2 pb-1 text-left">
                          <span
                            className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${dim.headerClass}`}
                          >
                            <span
                              className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold ${dim.iconWrap}`}
                            >
                              {dim.label.charAt(0)}
                            </span>
                            {dim.label}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {decision.role_performance.map((rp, idx) => {
                      const role = getRoleById(rp.role_id);
                      return (
                        <tr key={rp.role_id} className="align-middle">
                          <td className="rounded-l-lg bg-[var(--portal-page)] px-2.5 py-2.5 text-[12px] font-semibold text-[var(--portal-ink)]">
                            {role?.label ?? rp.role_id}
                          </td>
                          {PERF_CRITERIA.map((dim, dimIdx) => (
                            <td
                              key={dim.key}
                              className={`bg-[var(--portal-page)] px-2 py-2 ${
                                dimIdx === PERF_CRITERIA.length - 1
                                  ? "rounded-r-lg"
                                  : ""
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="range"
                                  min={1}
                                  max={10}
                                  className={`min-w-0 flex-1 ${dim.accent}`}
                                  value={rp[dim.key]}
                                  onChange={(e) => {
                                    const next = [...decision.role_performance];
                                    next[idx] = {
                                      ...next[idx],
                                      [dim.key]: Number(e.target.value),
                                    };
                                    update("role_performance", next);
                                  }}
                                  aria-label={`${role?.label ?? rp.role_id} ${dim.label}`}
                                />
                                <span
                                  className={`w-5 shrink-0 text-right text-[12px] font-bold tabular-nums ${dim.headerClass}`}
                                >
                                  {rp[dim.key]}
                                </span>
                              </div>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className="mt-2 border-t border-orange-100 pt-2.5 text-[11px] text-[var(--portal-muted)]">
                Scale: <span className="font-semibold text-[var(--portal-ink)]">1</span>{" "}
                = Low importance ·{" "}
                <span className="font-semibold text-[var(--portal-ink)]">10</span>{" "}
                = Critical for this role group. Higher weights raise evaluation
                emphasis and system cost.
              </p>
            </section>

            <MetricPreview
              showCalcLink
              calcTitle="Estimates update live from review cadence, 360° feedback, and role-level performance criteria."
              items={[
                {
                  label: "Review Coverage",
                  value: `${liveMetrics.reviewCoverage.toFixed(0)}%`,
                  icon: ClipboardCheck,
                  accent: "emerald",
                },
                {
                  label: "Productivity Impact",
                  value: formatSigned(liveMetrics.productivityImpact, "%"),
                  icon: TrendingUp,
                  accent: "blue",
                },
                {
                  label: "Leadership Score Impact",
                  value: formatSigned(liveMetrics.leadershipImpact, " pts"),
                  icon: Users,
                  accent: "orange",
                },
                {
                  label: "Annual System Cost",
                  value: formatCurrency(liveMetrics.performanceSystemCost),
                  icon: Coins,
                  accent: "violet",
                },
              ]}
            />
          </div>
        )}

        {activeTab === 2 && (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <section
                className={`flex flex-col rounded-xl border bg-white p-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] ${CARD_ACCENT.emerald.border}`}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${CARD_ACCENT.emerald.iconWrap}`}
                  >
                    <GraduationCap className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                  <div>
                    <h3 className={`text-sm font-bold ${CARD_ACCENT.emerald.title}`}>
                      1. Training Programs
                    </h3>
                    <p className="mt-0.5 text-[11px] leading-snug text-[var(--portal-muted)]">
                      Select the average number of participants per program
                    </p>
                  </div>
                </div>
                <ul className="mt-3 flex-1 space-y-2">
                  {DEVELOPMENTAL_PROGRAMS.map((prog) => {
                    const Icon = PROGRAM_ICONS[prog];
                    const count = programParticipantCount(prog);
                    return (
                      <li
                        key={prog}
                        className="flex items-center justify-between gap-2 text-[13px]"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                            <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-[var(--portal-ink)]">
                              {prog}
                            </span>
                            <span className="block text-[10px] text-[var(--portal-muted)]">
                              {formatCurrency(PROGRAM_COSTS[prog])} / participant
                            </span>
                          </span>
                        </span>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            className="h-7 w-7 rounded-md border border-[var(--portal-sidebar-border)] text-sm font-bold hover:bg-[#f4f5f7]"
                            onClick={() => setProgramParticipants(prog, 0)}
                            aria-label={`Decrease ${prog} participants`}
                          >
                            −
                          </button>
                          <span className="w-7 text-center text-sm font-semibold tabular-nums">
                            {count}
                          </span>
                          <button
                            type="button"
                            className="h-7 w-7 rounded-md border border-[var(--portal-sidebar-border)] text-sm font-bold hover:bg-[#f4f5f7]"
                            onClick={() =>
                              setProgramParticipants(
                                prog,
                                Math.max(1, trainingEstParticipants || 1)
                              )
                            }
                            aria-label={`Increase ${prog} participants`}
                          >
                            +
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-auto rounded-lg bg-emerald-50 px-2.5 py-2 text-[11px] leading-snug text-emerald-950">
                  Program costs will be applied based on the participants you
                  select (driven by coverage %).
                </p>
              </section>

              <section
                className={`flex flex-col rounded-xl border bg-white p-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] ${CARD_ACCENT.blue.border}`}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${CARD_ACCENT.blue.iconWrap}`}
                  >
                    <Percent className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                  <div>
                    <h3 className={`text-sm font-bold ${CARD_ACCENT.blue.title}`}>
                      2. Training Coverage
                    </h3>
                    <p className="mt-0.5 text-[11px] leading-snug text-[var(--portal-muted)]">
                      What percentage of your total employees will receive training?
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[11px] font-semibold text-[var(--portal-ink)]">
                      Employees Trained
                    </span>
                    <span className="text-2xl font-bold tabular-nums text-[var(--portal-accent-blue)]">
                      {decision.pct_employees_trained}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    className="mt-3 w-full accent-[var(--portal-accent-blue)]"
                    value={decision.pct_employees_trained}
                    onChange={(e) =>
                      update("pct_employees_trained", Number(e.target.value))
                    }
                  />
                  <div className="mt-1 flex justify-between text-[10px] text-[var(--portal-muted)]">
                    <span>0%</span>
                    <span>50%</span>
                  </div>
                </div>
                <p className="mt-auto rounded-lg bg-[var(--portal-accent-blue-soft)] px-2.5 py-2 text-[11px] leading-snug text-[var(--portal-title)]">
                  Higher coverage increases development opportunities across the
                  workforce (~{trainingEstParticipants} participants).
                </p>
              </section>

              <section
                className={`flex flex-col rounded-xl border bg-white p-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] ${CARD_ACCENT.violet.border}`}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${CARD_ACCENT.violet.iconWrap}`}
                  >
                    <Landmark className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                  <div>
                    <h3 className={`text-sm font-bold ${CARD_ACCENT.violet.title}`}>
                      3. Derived Training Budget
                    </h3>
                    <p className="mt-0.5 text-[11px] leading-snug text-[var(--portal-muted)]">
                      Estimated average training investment per employee
                    </p>
                  </div>
                </div>
                <div className="mt-6 text-center">
                  <p className="text-3xl font-bold tabular-nums text-[var(--portal-icon-purple)]">
                    {formatCurrency(derivedTrainingPerEe)}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--portal-muted)]">
                    Per-Employee Training Budget
                  </p>
                </div>
                <p className="mt-auto rounded-lg bg-violet-50 px-2.5 py-2 text-[11px] leading-snug text-[var(--portal-title)]">
                  Calculated from coverage &amp; selected programs.
                </p>
              </section>

              <section
                className={`flex flex-col rounded-xl border bg-white p-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] ${CARD_ACCENT.orange.border}`}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${CARD_ACCENT.orange.iconWrap}`}
                  >
                    <Sparkles className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                  <div>
                    <h3 className={`text-sm font-bold ${CARD_ACCENT.orange.title}`}>
                      4. Succession Investment
                    </h3>
                    <p className="mt-0.5 text-[11px] leading-snug text-[var(--portal-muted)]">
                      Set aside funds to strengthen your leadership pipeline
                    </p>
                  </div>
                </div>
                <label className="mt-4 block text-[11px] font-semibold text-[var(--portal-ink)]">
                  Succession Investment ($)
                  <div className="mt-1.5 flex items-center gap-2">
                    <button
                      type="button"
                      className="h-8 w-8 rounded-md border border-[var(--portal-sidebar-border)] font-bold hover:bg-[#f4f5f7]"
                      onClick={() =>
                        update(
                          "succession_investment",
                          Math.max(0, decision.succession_investment - 1000)
                        )
                      }
                    >
                      −
                    </button>
                    <input
                      type="number"
                      className={`w-full ${formInputClassName}`}
                      value={decision.succession_investment}
                      onChange={(e) =>
                        update("succession_investment", Number(e.target.value))
                      }
                    />
                    <button
                      type="button"
                      className="h-8 w-8 rounded-md border border-[var(--portal-sidebar-border)] font-bold hover:bg-[#f4f5f7]"
                      onClick={() =>
                        update(
                          "succession_investment",
                          decision.succession_investment + 1000
                        )
                      }
                    >
                      +
                    </button>
                  </div>
                </label>
                <p className="mt-auto rounded-lg bg-orange-50 px-2.5 py-2 text-[11px] leading-snug text-[var(--portal-title)]">
                  Succession investment builds bench strength and long-term
                  leadership continuity.
                </p>
              </section>
            </div>

            <MetricPreview
              showCalcLink
              calcTitle="Estimates update live from program mix, coverage, and succession investment."
              items={[
                {
                  label: "Learning BSC Impact",
                  value: formatSigned(liveMetrics.learningImpact, " pts"),
                  icon: GraduationCap,
                  accent: "emerald",
                },
                {
                  label: "Productivity Impact",
                  value: formatSigned(liveMetrics.trainingProdImpact, "%"),
                  icon: TrendingUp,
                  accent: "blue",
                },
                {
                  label: "Employee Development",
                  value: `${liveMetrics.employeeDevelopment.toFixed(0)}%`,
                  icon: Users,
                  accent: "violet",
                },
                {
                  label: "Total Training Investment",
                  value: formatCurrency(liveMetrics.trainingSpend),
                  icon: Coins,
                  accent: "orange",
                },
              ]}
            />
          </div>
        )}

        {activeTab === 3 && (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <section
                className={`flex flex-col rounded-xl border bg-white p-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] ${CARD_ACCENT.emerald.border}`}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${CARD_ACCENT.emerald.iconWrap}`}
                  >
                    <Smile className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                  <div>
                    <h3 className={`text-sm font-bold ${CARD_ACCENT.emerald.title}`}>
                      1. Engagement Investment
                    </h3>
                    <p className="mt-0.5 text-[11px] leading-snug text-[var(--portal-muted)]">
                      Fund recognition, culture, and listening programs
                    </p>
                  </div>
                </div>
                <label className="mt-4 block text-[11px] font-semibold text-[var(--portal-ink)]">
                  Engagement Investment ($)
                  <div className="mt-1.5 flex items-center gap-2">
                    <button
                      type="button"
                      className="h-8 w-8 rounded-md border border-[var(--portal-sidebar-border)] font-bold hover:bg-[#f4f5f7]"
                      onClick={() =>
                        update(
                          "engagement_investment",
                          Math.max(0, decision.engagement_investment - 500)
                        )
                      }
                    >
                      −
                    </button>
                    <input
                      type="number"
                      className={`w-full ${formInputClassName}`}
                      value={decision.engagement_investment}
                      onChange={(e) =>
                        update("engagement_investment", Number(e.target.value))
                      }
                    />
                    <button
                      type="button"
                      className="h-8 w-8 rounded-md border border-[var(--portal-sidebar-border)] font-bold hover:bg-[#f4f5f7]"
                      onClick={() =>
                        update(
                          "engagement_investment",
                          decision.engagement_investment + 500
                        )
                      }
                    >
                      +
                    </button>
                  </div>
                </label>
                <div className="mt-auto rounded-lg bg-emerald-50 px-2.5 py-2 text-[11px] leading-snug text-emerald-950">
                  <p className="font-bold text-emerald-800">Why it matters</p>
                  <p className="mt-0.5 font-medium">
                    Higher engagement improves satisfaction, reduces absenteeism,
                    and strengthens retention.
                  </p>
                </div>
              </section>

              <section
                className={`flex flex-col rounded-xl border bg-white p-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] ${CARD_ACCENT.blue.border}`}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${CARD_ACCENT.blue.iconWrap}`}
                  >
                    <Scale className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                  <div>
                    <h3 className={`text-sm font-bold ${CARD_ACCENT.blue.title}`}>
                      2. Conflict Approach
                    </h3>
                    <p className="mt-0.5 text-[11px] leading-snug text-[var(--portal-muted)]">
                      How workplace conflicts are resolved
                    </p>
                  </div>
                </div>
                <label className="mt-4 block text-[11px] font-semibold text-[var(--portal-ink)]">
                  Conflict Approach
                  <select
                    className={`mt-1.5 ${formSelectClassName}`}
                    value={decision.conflict_approach}
                    onChange={(e) =>
                      update(
                        "conflict_approach",
                        e.target.value as ConflictApproach
                      )
                    }
                  >
                    {(Object.keys(CONFLICT_CONFIG) as ConflictApproach[]).map(
                      (k) => (
                        <option key={k} value={k}>
                          {CONFLICT_LABELS[k]} ({formatCurrency(CONFLICT_CONFIG[k].cost)})
                        </option>
                      )
                    )}
                  </select>
                </label>
                <div className="mt-auto rounded-lg bg-[var(--portal-accent-blue-soft)] px-2.5 py-2 text-[11px] leading-snug text-[var(--portal-title)]">
                  <p className="font-bold text-[var(--portal-accent-blue)]">
                    About this option
                  </p>
                  <p className="mt-0.5 font-medium">
                    {CONFLICT_HINTS[decision.conflict_approach]}
                  </p>
                </div>
              </section>

              <section
                className={`flex flex-col rounded-xl border bg-white p-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] ${CARD_ACCENT.violet.border}`}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${CARD_ACCENT.violet.iconWrap}`}
                  >
                    <Home className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                  <div>
                    <h3 className={`text-sm font-bold ${CARD_ACCENT.violet.title}`}>
                      3. Workplace Flexibility
                    </h3>
                    <p className="mt-0.5 text-[11px] leading-snug text-[var(--portal-muted)]">
                      Where and how work gets done
                    </p>
                  </div>
                </div>
                <label className="mt-4 block text-[11px] font-semibold text-[var(--portal-ink)]">
                  Flexibility Model
                  <select
                    className={`mt-1.5 ${formSelectClassName}`}
                    value={decision.flexibility_level}
                    onChange={(e) =>
                      update(
                        "flexibility_level",
                        Number(e.target.value) as 0 | 1 | 2
                      )
                    }
                  >
                    <option value={0}>None</option>
                    <option value={1}>Hybrid</option>
                    <option value={2}>Full flexibility</option>
                  </select>
                </label>
                <div className="mt-auto rounded-lg bg-violet-50 px-2.5 py-2 text-[11px] leading-snug text-[var(--portal-title)]">
                  <p className="font-bold text-[var(--portal-icon-purple)]">
                    Consider
                  </p>
                  <p className="mt-0.5 font-medium">
                    {FLEXIBILITY_HINTS[decision.flexibility_level]}
                  </p>
                </div>
              </section>

              <section
                className={`flex flex-col rounded-xl border bg-white p-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] ${CARD_ACCENT.orange.border}`}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${CARD_ACCENT.orange.iconWrap}`}
                  >
                    <Megaphone className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                  <div>
                    <h3 className={`text-sm font-bold ${CARD_ACCENT.orange.title}`}>
                      4. Voice Mechanisms
                    </h3>
                    <p className="mt-0.5 text-[11px] leading-snug text-[var(--portal-muted)]">
                      How employees share feedback
                    </p>
                  </div>
                </div>
                <label className="mt-4 block text-[11px] font-semibold text-[var(--portal-ink)]">
                  Voice Level
                  <select
                    className={`mt-1.5 ${formSelectClassName}`}
                    value={decision.voice_mechanisms}
                    onChange={(e) =>
                      update(
                        "voice_mechanisms",
                        Number(e.target.value) as 0 | 1 | 2
                      )
                    }
                  >
                    <option value={0}>None</option>
                    <option value={1}>Basic</option>
                    <option value={2}>Advanced</option>
                  </select>
                </label>
                <div className="mt-auto rounded-lg bg-orange-50 px-2.5 py-2 text-[11px] leading-snug text-[var(--portal-title)]">
                  <p className="font-bold text-[var(--portal-icon-orange)]">
                    What this includes
                  </p>
                  <p className="mt-0.5 font-medium">
                    {VOICE_HINTS[decision.voice_mechanisms]}
                  </p>
                </div>
              </section>
            </div>

            <MetricPreview
              showCalcLink
              calcTitle="Estimates update live from engagement spend, conflict approach, flexibility, and voice mechanisms."
              items={[
                {
                  label: "Employee Satisfaction Impact",
                  value: formatSigned(liveMetrics.satisfactionImpact, " pts"),
                  icon: Smile,
                  accent: "emerald",
                },
                {
                  label: "Engagement Impact",
                  value: formatSigned(liveMetrics.engagementImpact, "%"),
                  icon: Users,
                  accent: "blue",
                },
                {
                  label: "Absenteeism Impact",
                  value: formatSigned(liveMetrics.absenteeismImpact, " pts"),
                  icon: CalendarRange,
                  accent: "violet",
                },
                {
                  label: "DEI & Inclusion Impact",
                  value: formatSigned(liveMetrics.relationsDeiImpact, " pts"),
                  icon: HeartHandshake,
                  accent: "orange",
                },
              ]}
            />
          </div>
        )}

        {activeTab === 4 && (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <section
                className={`flex flex-col rounded-xl border bg-white p-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] md:col-span-2 xl:col-span-1 ${CARD_ACCENT.emerald.border}`}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${CARD_ACCENT.emerald.iconWrap}`}
                  >
                    <Wallet className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                  <div>
                    <h3 className={`text-sm font-bold ${CARD_ACCENT.emerald.title}`}>
                      1. Salary Strategy by Role
                    </h3>
                    <p className="mt-0.5 text-[11px] leading-snug text-[var(--portal-muted)]">
                      Position each role vs market
                    </p>
                  </div>
                </div>
                <ul className="mt-3 flex-1 space-y-2">
                  {decision.role_compensation.map((rc, idx) => {
                    const role = getRoleById(rc.role_id);
                    return (
                      <li key={rc.role_id}>
                        <label className="block text-[11px] font-semibold text-[var(--portal-ink)]">
                          {role?.label ?? rc.role_id}
                          <select
                            className={`mt-1 ${formSelectClassName}`}
                            value={rc.salary_band}
                            onChange={(e) => {
                              const next = [...decision.role_compensation];
                              next[idx] = {
                                ...next[idx],
                                salary_band: Number(e.target.value) as SalaryBand,
                              };
                              update("role_compensation", next);
                            }}
                          >
                            {SALARY_BAND_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-auto rounded-lg bg-emerald-50 px-2.5 py-2 text-[11px] leading-snug text-emerald-950">
                  Salary position options compare to industry market benchmarks.
                </p>
              </section>

              <section
                className={`flex flex-col rounded-xl border bg-white p-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] ${CARD_ACCENT.blue.border}`}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${CARD_ACCENT.blue.iconWrap}`}
                  >
                    <Gift className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                  <div>
                    <h3 className={`text-sm font-bold ${CARD_ACCENT.blue.title}`}>
                      2. Benefits Level
                    </h3>
                    <p className="mt-0.5 text-[11px] leading-snug text-[var(--portal-muted)]">
                      Benefits as % of salary
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[11px] font-semibold text-[var(--portal-ink)]">
                      Benefits %
                    </span>
                    <span className="text-2xl font-bold tabular-nums text-[var(--portal-accent-blue)]">
                      {decision.benefits_pct}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={6}
                    max={20}
                    className="mt-3 w-full accent-[var(--portal-accent-blue)]"
                    value={decision.benefits_pct}
                    onChange={(e) =>
                      update("benefits_pct", Number(e.target.value))
                    }
                  />
                  <div className="mt-1 flex justify-between text-[10px] text-[var(--portal-muted)]">
                    <span>6%</span>
                    <span>20%</span>
                  </div>
                </div>
                <p className="mt-auto rounded-lg bg-[var(--portal-accent-blue-soft)] px-2.5 py-2 text-[11px] leading-snug text-[var(--portal-title)]">
                  Richer benefits packages strengthen attraction and retention
                  while raising total rewards cost.
                </p>
              </section>

              <section
                className={`flex flex-col rounded-xl border bg-white p-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] ${CARD_ACCENT.violet.border}`}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${CARD_ACCENT.violet.iconWrap}`}
                  >
                    <Award className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                  <div>
                    <h3 className={`text-sm font-bold ${CARD_ACCENT.violet.title}`}>
                      3. Bonus Tier
                    </h3>
                    <p className="mt-0.5 text-[11px] leading-snug text-[var(--portal-muted)]">
                      Variable pay as % of salary
                    </p>
                  </div>
                </div>
                <label className="mt-4 block text-[11px] font-semibold text-[var(--portal-ink)]">
                  Bonus Tier
                  <select
                    className={`mt-1.5 ${formSelectClassName}`}
                    value={decision.bonus_tier}
                    onChange={(e) =>
                      update(
                        "bonus_tier",
                        Number(e.target.value) as Decision["bonus_tier"]
                      )
                    }
                  >
                    <option value={5}>5% of annual salary</option>
                    <option value={10}>10% of annual salary</option>
                    <option value={15}>15% of annual salary</option>
                  </select>
                </label>
                <p className="mt-auto rounded-lg bg-violet-50 px-2.5 py-2 text-[11px] leading-snug text-[var(--portal-title)]">
                  Higher bonus tiers can boost motivation and retention with
                  greater variable cost exposure.
                </p>
              </section>

              <section
                className={`flex flex-col rounded-xl border bg-white p-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] ${CARD_ACCENT.orange.border}`}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${CARD_ACCENT.orange.iconWrap}`}
                  >
                    <TrendingUp className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                  <div>
                    <h3 className={`text-sm font-bold ${CARD_ACCENT.orange.title}`}>
                      4. Equity / Stock Options
                    </h3>
                    <p className="mt-0.5 text-[11px] leading-snug text-[var(--portal-muted)]">
                      Long-term ownership incentives
                    </p>
                  </div>
                </div>
                <label className="mt-4 block text-[11px] font-semibold text-[var(--portal-ink)]">
                  Equity Level
                  <select
                    className={`mt-1.5 ${formSelectClassName}`}
                    value={decision.equity_level}
                    onChange={(e) =>
                      update("equity_level", Number(e.target.value) as 0 | 1 | 2)
                    }
                  >
                    <option value={0}>None</option>
                    <option value={1}>Basic</option>
                    <option value={2}>Full</option>
                  </select>
                </label>
                <p className="mt-auto rounded-lg bg-orange-50 px-2.5 py-2 text-[11px] leading-snug text-[var(--portal-title)]">
                  Equity can strengthen retention for key talent, especially in
                  competitive markets.
                </p>
              </section>

              <section
                className={`flex flex-col rounded-xl border bg-white p-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] ${CARD_ACCENT.teal.border}`}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${CARD_ACCENT.teal.iconWrap}`}
                  >
                    <Monitor className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                  <div>
                    <h3 className={`text-sm font-bold ${CARD_ACCENT.teal.title}`}>
                      5. HR Technology
                    </h3>
                    <p className="mt-0.5 text-[11px] leading-snug text-[var(--portal-muted)]">
                      Systems that run HR operations
                    </p>
                  </div>
                </div>
                <label className="mt-4 block text-[11px] font-semibold text-[var(--portal-ink)]">
                  HR Tech Level
                  <select
                    className={`mt-1.5 ${formSelectClassName}`}
                    value={decision.hr_tech_level}
                    onChange={(e) =>
                      update("hr_tech_level", Number(e.target.value) as 0 | 1 | 2)
                    }
                  >
                    <option value={0}>Basic (no cost)</option>
                    <option value={1}>HRIS ($15,000/year)</option>
                    <option value={2}>HRIS + Analytics ($30,000/year)</option>
                  </select>
                </label>
                <p className="mt-auto rounded-lg bg-teal-50 px-2.5 py-2 text-[11px] leading-snug text-teal-900">
                  Stronger HR tech improves data quality, process efficiency, and
                  decision support.
                </p>
              </section>
            </div>

            <CompensationBreakdown
              decision={decision}
              budget={budget}
              headcount={prior.headcount}
              marketSalary={industryConfig.base_market_salary}
            />

            <MetricPreview
              showCalcLink
              calcTitle="Estimates update live from salary bands, benefits, bonus, equity, and HR technology."
              items={[
                {
                  label: "Turnover Impact",
                  value: formatSigned(liveMetrics.turnoverImpact, " pts"),
                  icon: UsersRound,
                  accent: "violet",
                },
                {
                  label: "Retention Impact",
                  value: formatSigned(liveMetrics.retentionImpact, " pts"),
                  icon: Smile,
                  accent: "emerald",
                },
                {
                  label: "Financial Impact",
                  value: formatCurrency(liveMetrics.financialImpact),
                  icon: TrendingUp,
                  accent: "blue",
                },
                {
                  label: "Employee Motivation Impact",
                  value: formatSigned(liveMetrics.motivationImpact, " pts"),
                  icon: Award,
                  accent: "orange",
                },
              ]}
            />
          </div>
        )}

        {activeTab === 5 && (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <section
                className={`flex flex-col rounded-xl border bg-white p-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] ${CARD_ACCENT.emerald.border}`}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${CARD_ACCENT.emerald.iconWrap}`}
                  >
                    <Building2 className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                  <div>
                    <h3 className={`text-sm font-bold ${CARD_ACCENT.emerald.title}`}>
                      1. Organizational Structure
                    </h3>
                    <p className="mt-0.5 text-[11px] leading-snug text-[var(--portal-muted)]">
                      How work and authority are organized
                    </p>
                  </div>
                </div>
                <label className="mt-4 block text-[11px] font-semibold text-[var(--portal-ink)]">
                  Structure Type
                  <select
                    className={`mt-1.5 ${formSelectClassName}`}
                    value={decision.organizational_structure}
                    onChange={(e) =>
                      update(
                        "organizational_structure",
                        e.target.value as OrganizationalStructure
                      )
                    }
                  >
                    {ORG_STRUCTURES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="mt-auto rounded-lg bg-emerald-50 px-2.5 py-2 text-[11px] leading-snug text-emerald-950">
                  {STRUCTURE_CUES[decision.organizational_structure]}
                </p>
              </section>

              <section
                className={`flex flex-col rounded-xl border bg-white p-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] ${CARD_ACCENT.blue.border}`}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${CARD_ACCENT.blue.iconWrap}`}
                  >
                    <GitBranch className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                  <div>
                    <h3 className={`text-sm font-bold ${CARD_ACCENT.blue.title}`}>
                      2. Span of Control
                    </h3>
                    <p className="mt-0.5 text-[11px] leading-snug text-[var(--portal-muted)]">
                      Average direct reports per manager
                    </p>
                  </div>
                </div>
                <label className="mt-4 block text-[11px] font-semibold text-[var(--portal-ink)]">
                  Average Span of Control
                  <div className="mt-1.5 flex items-center gap-2">
                    <button
                      type="button"
                      className="h-8 w-8 rounded-md border border-[var(--portal-sidebar-border)] font-bold hover:bg-[#f4f5f7]"
                      onClick={() =>
                        update(
                          "span_of_control",
                          Math.max(2, decision.span_of_control - 1)
                        )
                      }
                    >
                      −
                    </button>
                    <span className="min-w-[2.5rem] flex-1 rounded-md border border-[var(--portal-sidebar-border)] bg-white px-2 py-1.5 text-center text-lg font-semibold tabular-nums">
                      {decision.span_of_control}
                    </span>
                    <button
                      type="button"
                      className="h-8 w-8 rounded-md border border-[var(--portal-sidebar-border)] font-bold hover:bg-[#f4f5f7]"
                      onClick={() =>
                        update(
                          "span_of_control",
                          Math.min(20, decision.span_of_control + 1)
                        )
                      }
                    >
                      +
                    </button>
                  </div>
                  <p className="mt-1.5 text-[10px] text-[var(--portal-muted)]">
                    Recommended: 4 – 8
                  </p>
                </label>
                <p className="mt-auto rounded-lg bg-[var(--portal-accent-blue-soft)] px-2.5 py-2 text-[11px] leading-snug text-[var(--portal-title)]">
                  Wider spans reduce layers but can stretch managerial capacity;
                  narrower spans add coaching bandwidth.
                </p>
              </section>

              <section
                className={`flex flex-col rounded-xl border bg-white p-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] ${CARD_ACCENT.violet.border}`}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${CARD_ACCENT.violet.iconWrap}`}
                  >
                    <Target className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                  <div>
                    <h3 className={`text-sm font-bold ${CARD_ACCENT.violet.title}`}>
                      3. Process Focus
                    </h3>
                    <p className="mt-0.5 text-[11px] leading-snug text-[var(--portal-muted)]">
                      Primary operating priority
                    </p>
                  </div>
                </div>
                <label className="mt-4 block text-[11px] font-semibold text-[var(--portal-ink)]">
                  Primary Focus
                  <select
                    className={`mt-1.5 ${formSelectClassName}`}
                    value={decision.process_focus}
                    onChange={(e) =>
                      update("process_focus", e.target.value as ProcessFocus)
                    }
                  >
                    {PROCESS_FOCUS_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="mt-auto rounded-lg bg-violet-50 px-2.5 py-2 text-[11px] leading-snug text-[var(--portal-title)]">
                  {PROCESS_FOCUS_HINTS[decision.process_focus]}
                </p>
              </section>

              <section
                className={`flex flex-col rounded-xl border bg-white p-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] ${CARD_ACCENT.orange.border}`}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${CARD_ACCENT.orange.iconWrap}`}
                  >
                    <RefreshCw className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                  <div>
                    <h3 className={`text-sm font-bold ${CARD_ACCENT.orange.title}`}>
                      4. Change Management Capability
                    </h3>
                    <p className="mt-0.5 text-[11px] leading-snug text-[var(--portal-muted)]">
                      Investment in change readiness
                    </p>
                  </div>
                </div>
                <label className="mt-4 block text-[11px] font-semibold text-[var(--portal-ink)]">
                  Investment Level
                  <select
                    className={`mt-1.5 ${formSelectClassName}`}
                    value={decision.change_management_capability}
                    onChange={(e) =>
                      update(
                        "change_management_capability",
                        e.target.value as InvestmentLevel
                      )
                    }
                  >
                    {INVESTMENT_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level} ({formatCurrency(CHANGE_MGMT_COST[level])})
                      </option>
                    ))}
                  </select>
                </label>
                <p className="mt-auto rounded-lg bg-orange-50 px-2.5 py-2 text-[11px] leading-snug text-[var(--portal-title)]">
                  {CHANGE_MGMT_HINTS[decision.change_management_capability]}
                </p>
              </section>

              <section
                className={`flex flex-col rounded-xl border bg-white p-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] ${CARD_ACCENT.teal.border}`}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${CARD_ACCENT.teal.iconWrap}`}
                  >
                    <UsersRound className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                  <div>
                    <h3 className={`text-sm font-bold ${CARD_ACCENT.teal.title}`}>
                      5. Collaboration Enablement
                    </h3>
                    <p className="mt-0.5 text-[11px] leading-snug text-[var(--portal-muted)]">
                      Tools and rituals for teamwork
                    </p>
                  </div>
                </div>
                <label className="mt-4 block text-[11px] font-semibold text-[var(--portal-ink)]">
                  Collaboration Level
                  <select
                    className={`mt-1.5 ${formSelectClassName}`}
                    value={decision.collaboration_enablement}
                    onChange={(e) =>
                      update(
                        "collaboration_enablement",
                        e.target.value as CollaborationEnablement
                      )
                    }
                  >
                    {COLLABORATION_OPTIONS.map((level) => (
                      <option key={level} value={level}>
                        {level} ({formatCurrency(COLLABORATION_COST[level])})
                      </option>
                    ))}
                  </select>
                </label>
                <p className="mt-auto rounded-lg bg-teal-50 px-2.5 py-2 text-[11px] leading-snug text-teal-900">
                  {COLLABORATION_HINTS[decision.collaboration_enablement]}
                </p>
              </section>
            </div>

            <MetricPreview
              showCalcLink
              calcTitle="Estimates update live from structure, span, process focus, change capability, and collaboration."
              items={[
                {
                  label: "Efficiency Impact",
                  value: formatSigned(liveMetrics.efficiencyImpact, "%"),
                  icon: TrendingUp,
                  accent: "emerald",
                },
                {
                  label: "Agility Impact",
                  value: formatSigned(liveMetrics.agilityImpact, " pts"),
                  icon: RefreshCw,
                  accent: "orange",
                },
                {
                  label: "Collaboration Impact",
                  value: formatSigned(liveMetrics.collaborationImpact, " pts"),
                  icon: UsersRound,
                  accent: "violet",
                },
                {
                  label: "Change Readiness Impact",
                  value: formatSigned(liveMetrics.changeReadinessImpact, " pts"),
                  icon: Building2,
                  accent: "blue",
                },
              ]}
            />
          </div>
        )}

        {activeTab === 6 && (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {DEI_CARDS.map((card, idx) => {
                const accent = CARD_ACCENT[card.accent];
                const Icon = card.icon;
                return (
                  <section
                    key={card.key}
                    className={`flex flex-col rounded-xl border bg-white p-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] ${accent.border}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${accent.iconWrap}`}
                      >
                        <Icon className="h-4 w-4" strokeWidth={2.25} />
                      </span>
                      <div>
                        <h3 className={`text-sm font-bold ${accent.title}`}>
                          {idx + 1}. {card.label}
                        </h3>
                        <p className="mt-0.5 text-[11px] leading-snug text-[var(--portal-muted)]">
                          Set investment intensity for this pillar
                        </p>
                      </div>
                    </div>
                    <label className="mt-4 block text-[11px] font-semibold text-[var(--portal-ink)]">
                      Investment Level
                      <select
                        className={`mt-1.5 ${formSelectClassName}`}
                        value={decision[card.key]}
                        onChange={(e) =>
                          update(card.key, e.target.value as InvestmentLevel)
                        }
                      >
                        {INVESTMENT_LEVELS.map((level) => (
                          <option key={level} value={level}>
                            {level} ({formatCurrency(DEI_LEVEL_COST[level])})
                          </option>
                        ))}
                      </select>
                    </label>
                    <p
                      className={`mt-auto rounded-lg px-2.5 py-2 text-[11px] leading-snug ${accent.footer}`}
                    >
                      {card.cue}
                    </p>
                  </section>
                );
              })}
            </div>

            <MetricPreview
              showCalcLink
              calcTitle="Estimates update live from your DEI portfolio across pipelines, equity, inclusion, education, and accessibility."
              items={[
                {
                  label: "Talent Attraction Impact",
                  value: formatSigned(liveMetrics.talentAttractionImpact, " pts"),
                  icon: UsersRound,
                  accent: "emerald",
                },
                {
                  label: "Employee Experience Impact",
                  value: formatSigned(
                    liveMetrics.employeeExperienceImpact,
                    " pts"
                  ),
                  icon: HeartHandshake,
                  accent: "blue",
                },
                {
                  label: "Retention Impact",
                  value: formatSigned(liveMetrics.deiRetentionImpact, " pts"),
                  icon: Smile,
                  accent: "violet",
                },
                {
                  label: "Innovation Impact",
                  value: formatSigned(liveMetrics.innovationImpact, " pts"),
                  icon: Sparkles,
                  accent: "orange",
                },
              ]}
            />
          </div>
        )}

          {!hideRunButton && (
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => setShowResults(true)}>Run simulation</Button>
              <Button
                variant="outline"
                onClick={() => {
                  const defaults = createDefaultDecision();
                  if (onDecisionChange) onDecisionChange(defaults);
                  else setInternalDecision(defaults);
                }}
              >
                Reset defaults
              </Button>
            </div>
          )}
        </div>

        <aside className="space-y-3 lg:sticky lg:top-16 lg:self-start">
          <DecisionGuidance
            industry={industry}
            module={MODULES[activeTab]}
            yourInvestmentPct={yourInvestmentPct}
            warnings={warnings}
            moduleSpend={activeModuleSpend}
            availableBudget={budget.available_budget}
          />
        </aside>
      </div>

      {(onSaveNow || onSaveAndContinue) && (
        <DecisionStickyFooter
          saving={saving}
          continueLabel={nextLabel}
          onSaveNow={onSaveNow}
          onSaveAndContinue={onSaveAndContinue}
        />
      )}

      {outcome && (
        <div className="space-y-6 border-t border-[var(--portal-sidebar-border)] pt-8">
          <h2 className="text-xl font-semibold text-[var(--portal-title)]">Round results</h2>
          <BSCScorecard
            scores={outcome.bsc_scores}
            bscWeights={strategyConfig.bsc_weights}
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Revenue" value={formatCurrency(outcome.financial_metrics.revenue)} />
            <MetricCard label="Profit" value={formatCurrency(outcome.financial_metrics.profit)} />
            <MetricCard
              label="Productivity"
              value={(outcome.hr_metrics.productivity * 100).toFixed(1) + "%"}
            />
            <MetricCard
              label="Hiring quality"
              value={outcome.hr_metrics.hiring_quality.toFixed(0) + "/100"}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--portal-sidebar-border)] bg-white p-4">
      <p className="text-xs text-[var(--portal-muted)]">{label}</p>
      <p className="text-lg font-semibold text-[var(--portal-title)]">{value}</p>
    </div>
  );
}
