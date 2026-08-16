import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CircleDollarSign,
  Cpu,
  TrendingUp,
  Users,
} from "lucide-react";

export const INDUSTRY_OUTLOOK = [
  {
    label: "Industry Outlook",
    value: "Favorable",
    icon: TrendingUp,
    valueClass: "text-emerald-700",
    iconWrap: "bg-emerald-50 text-emerald-700",
  },
  {
    label: "Workforce Outlook",
    value: "Competitive",
    icon: Users,
    valueClass: "text-[var(--portal-accent-blue)]",
    iconWrap: "bg-[var(--portal-accent-blue-soft)] text-[var(--portal-accent-blue)]",
  },
  {
    label: "Technology Change",
    value: "Moderate",
    icon: Cpu,
    valueClass: "text-[var(--portal-purple)]",
    iconWrap: "bg-violet-50 text-[var(--portal-purple)]",
  },
  {
    label: "Cost Pressure",
    value: "Moderate",
    icon: CircleDollarSign,
    valueClass: "text-[var(--portal-brand)]",
    iconWrap: "bg-[var(--portal-brand-soft)] text-[var(--portal-brand)]",
  },
  {
    label: "Market Demand",
    value: "Stable",
    icon: BarChart3,
    valueClass: "text-emerald-700",
    iconWrap: "bg-emerald-50 text-emerald-700",
  },
] as const satisfies Array<{
  label: string;
  value: string;
  icon: LucideIcon;
  valueClass: string;
  iconWrap: string;
}>;

const STRATEGY_POINTS: Record<string, string[]> = {
  Focus: [
    "Target a specific market segment",
    "Differentiate on value",
    "Keep operations tight and reliable",
    "Align HR systems with the focused offering",
    "Protect quality in the chosen segment",
  ],
  "Cost Leadership": [
    "Compete on efficiency and unit cost",
    "Keep compensation and staffing disciplined",
    "Standardize processes where possible",
    "Invest only where productivity gains are clear",
    "Protect budget adherence across HR modules",
  ],
  Differentiation: [
    "Compete on quality, brand, and capability",
    "Invest in talent quality and development",
    "Build distinctive employee experience",
    "Protect retention of scarce skills",
    "Align rewards with high performance",
  ],
  Innovation: [
    "Build capability for new products and methods",
    "Invest in learning, succession, and HR technology",
    "Protect a pipeline of scarce technical talent",
    "Enable collaboration and change readiness",
    "Accept higher development investment where it compounds",
  ],
  "Customer Intimacy": [
    "Compete on service and relationship quality",
    "Invest in engagement and frontline capability",
    "Hire and develop for customer-facing excellence",
    "Keep employee experience aligned with service brand",
    "Use feedback systems to improve service delivery",
  ],
};

export function strategyPoints(strategy: string | null | undefined) {
  if (strategy && STRATEGY_POINTS[strategy]) return STRATEGY_POINTS[strategy];
  return [
    "Align recruitment, performance, and development with how you compete",
    "Keep compensation and staffing consistent with strategy",
    "Invest in the HR systems that support your chosen position",
    "Review tradeoffs in Review & Submit before you lock decisions",
    "Use round results to refine the next set of HR choices",
  ];
}

export function hrImplications(industry: string, strategy: string) {
  return [
    {
      label: "Talent Needs",
      text: `Hire and develop the skills a ${industry} workforce needs to execute a ${strategy} strategy.`,
      accent: "border-l-emerald-500",
    },
    {
      label: "Workforce Planning",
      text: "Staff to demand and keep headcount, hiring, and turnover decisions connected.",
      accent: "border-l-[var(--portal-accent-blue)]",
    },
    {
      label: "Training & Development",
      text: "Build the capabilities this industry rewards, without overspending the suggested range.",
      accent: "border-l-[var(--portal-purple)]",
    },
    {
      label: "Performance Management",
      text: "Set review cadence and criteria so execution stays visible across role groups.",
      accent: "border-l-sky-500",
    },
    {
      label: "Compensation Strategy",
      text: "Keep pay, benefits, and bonuses coherent with market pressure and your strategy.",
      accent: "border-l-[var(--portal-brand)]",
    },
    {
      label: "Employee Engagement",
      text: "Use relations and voice mechanisms to hold satisfaction when the talent market is competitive.",
      accent: "border-l-amber-500",
    },
    {
      label: "Change & Innovation",
      text: "Match org design and change capability to how fast this industry and strategy need to move.",
      accent: "border-l-teal-500",
    },
  ];
}
