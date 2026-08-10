import type { FinancialRoundItem } from "@/components/reports/FinancialReportChrome";

/** Figma demo Round 1 numbers used as the statement template. */
export const FIGMA_BS = {
  cash: 8_750_000,
  priorCash: 10_200_000,
  ar: 6_420_000,
  priorAr: 5_900_000,
  otherCurrent: 1_150_000,
  priorOtherCurrent: 1_050_000,
  ppe: 21_500_000,
  priorPpe: 21_000_000,
  hrTechAsset: 1_850_000,
  priorHrTechAsset: 1_500_000,
  otherLt: 2_500_000,
  priorOtherLt: 2_400_000,
  ap: 4_750_000,
  priorAp: 4_300_000,
  accruedComp: 3_250_000,
  priorAccruedComp: 2_950_000,
  otherCl: 1_200_000,
  priorOtherCl: 1_100_000,
  ltDebt: 12_000_000,
  priorLtDebt: 12_500_000,
  otherLtLiab: 1_500_000,
  priorOtherLtLiab: 1_450_000,
  contributed: 12_000_000,
  priorContributed: 12_000_000,
  retained: 7_470_000,
  priorRetained: 7_750_000,
  compensation: 17_060_000,
  recruitment: 1_240_000,
  training: 825_000,
  hrTechSpend: 350_000,
  turnover: 425_000,
};

export const FIGMA_PL = {
  revenue: 50_117_000,
  priorRevenue: 48_750_000,
  wages: 14_500_000,
  priorWages: 13_900_000,
  benefits: 2_560_000,
  priorBenefits: 2_400_000,
  recruitment: 1_240_000,
  priorRecruitment: 950_000,
  training: 825_000,
  priorTraining: 700_000,
  performance: 375_000,
  priorPerformance: 340_000,
  relations: 225_000,
  priorRelations: 190_000,
  hrTech: 350_000,
  priorHrTech: 300_000,
  turnover: 425_000,
  priorTurnover: 500_000,
  otherOpEx: 31_144_430,
  priorOtherOpEx: 28_800_000,
  interest: 300_000,
  priorInterest: 275_000,
  headcount: 281,
  priorHeadcount: 284,
};

export const FIGMA_CF = {
  cashFromOps: 49_200_000,
  priorCashFromOps: 47_500_000,
  compPaid: -17_060_000,
  priorCompPaid: -16_300_000,
  recruitment: -1_240_000,
  priorRecruitment: -950_000,
  training: -825_000,
  priorTraining: -700_000,
  otherOp: -25_500_000,
  priorOtherOp: -24_100_000,
  hrTech: -350_000,
  priorHrTech: -300_000,
  otherInvest: -750_000,
  priorOtherInvest: -600_000,
  debt: -500_000,
  priorDebt: 0,
  beginCash: 5_775_000,
  priorBeginCash: 5_650_000,
  endingCash: 8_750_000,
  priorEndingCash: 10_200_000,
};

export function formatRoundDate(value: string | null | undefined) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export function formatAsOfDate(value: string | null | undefined) {
  if (!value) return "July 31, 2026";
  try {
    return new Date(value).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "July 31, 2026";
  }
}

export function mapOutcomesToRounds(
  outcomes: Array<Record<string, unknown>>,
  basePath: string
): FinancialRoundItem[] {
  return outcomes.map((o) => {
    const r = o.rounds as unknown as {
      id: string;
      round_number: number;
      closed_at: string | null;
    } | null;
    return {
      id: String(o.id),
      roundId: String(o.round_id ?? r?.id ?? ""),
      roundNumber: r?.round_number ?? 0,
      dateLabel: formatRoundDate(
        r?.closed_at ?? (o.computed_at as string | undefined)
      ),
      href: `${basePath}?round=${o.round_id}`,
    };
  });
}

/** Scale Figma template by live revenue when available. */
export function scaleByRevenue(liveRevenue: number | null | undefined) {
  const base = FIGMA_PL.revenue;
  const rev = liveRevenue != null && liveRevenue > 0 ? liveRevenue : base;
  return rev / base;
}
