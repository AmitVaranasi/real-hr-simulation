import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { FeedbackPayload } from "@/lib/engine/types";
import { formatCurrency, formatPercent } from "@/lib/utils";

export interface PdfReportData {
  sessionName: string;
  teamName: string;
  industry: string;
  strategy: string;
  roundNumber: number;
  bsc: {
    financial: number;
    employee: number;
    process: number;
    learning: number;
    total: number;
  };
  metrics: Array<{ name: string; value: string }>;
  financials: Array<{ label: string; value: string }>;
  feedback?: FeedbackPayload;
  reflection?: string;
}

export function generateTeamPdf(data: PdfReportData): void {
  const doc = new jsPDF();
  let y = 20;

  doc.setFontSize(18);
  doc.text("Real HR Simulation — Team Report", 14, y);
  y += 10;
  doc.setFontSize(11);
  doc.text(data.sessionName, 14, y);
  y += 6;
  doc.text(`${data.teamName} · ${data.industry} · ${data.strategy}`, 14, y);
  y += 6;
  doc.text(`Round ${data.roundNumber}`, 14, y);
  y += 12;

  doc.setFontSize(14);
  doc.text("Balanced Scorecard", 14, y);
  y += 8;
  autoTable(doc, {
    startY: y,
    head: [["Perspective", "Score"]],
    body: [
      ["Financial", data.bsc.financial.toFixed(1)],
      ["Employee", data.bsc.employee.toFixed(1)],
      ["Internal Process", data.bsc.process.toFixed(1)],
      ["Learning & Growth", data.bsc.learning.toFixed(1)],
      ["Total", data.bsc.total.toFixed(1)],
    ],
  });
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  doc.setFontSize(14);
  doc.text("HR Metrics", 14, y);
  y += 4;
  autoTable(doc, {
    startY: y,
    head: [["Metric", "Value"]],
    body: data.metrics.map((m) => [m.name, m.value]),
  });
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  if (y > 240) {
    doc.addPage();
    y = 20;
  }
  doc.setFontSize(14);
  doc.text("Financial Summary", 14, y);
  autoTable(doc, {
    startY: y + 4,
    head: [["Metric", "Value"]],
    body: data.financials.map((f) => [f.label, f.value]),
  });

  if (data.feedback?.round_summary) {
    if (y > 220) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(14);
    doc.text("Round Summary", 14, y + 8);
    doc.setFontSize(10);
    const summaryLines = doc.splitTextToSize(data.feedback.round_summary, 180);
    doc.text(summaryLines, 14, y + 16);
    y += 16 + summaryLines.length * 5;
  }

  if (data.reflection) {
    doc.addPage();
    doc.setFontSize(14);
    doc.text("Team Reflection", 14, 20);
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(data.reflection, 180);
    doc.text(lines, 14, 30);
  }

  doc.save(`${data.teamName.replace(/\s+/g, "_")}_Round${data.roundNumber}.pdf`);
}

export function outcomeToPdfData(
  sessionName: string,
  team: { name: string; industry: string; strategy: string },
  roundNumber: number,
  outcome: Record<string, unknown>
): PdfReportData {
  const feedback = outcome.feedback_json as FeedbackPayload | undefined;
  return {
    sessionName,
    teamName: team.name,
    industry: team.industry,
    strategy: team.strategy,
    roundNumber,
    bsc: {
      financial: Number(outcome.score_financial),
      employee: Number(outcome.score_employee),
      process: Number(outcome.score_process),
      learning: Number(outcome.score_learning),
      total: Number(
        outcome.instructor_override ?? outcome.total_score
      ),
    },
    metrics: [
      { name: "Cost per hire", value: formatCurrency(Number(outcome.cost_per_hire)) },
      { name: "Time to fill", value: `${Number(outcome.time_to_fill).toFixed(0)} days` },
      { name: "Turnover", value: formatPercent(Number(outcome.turnover_rate)) },
      { name: "Satisfaction", value: `${Number(outcome.employee_satisfaction).toFixed(0)}/100` },
      { name: "Engagement", value: `${Number(outcome.engagement_level).toFixed(0)}/100` },
      { name: "Training ROI", value: formatPercent(Number(outcome.training_roi)) },
      { name: "DEI score", value: `${Number(outcome.dei_score).toFixed(0)}/100` },
      { name: "Budget adherence", value: formatPercent(Number(outcome.budget_adherence)) },
      {
        name: "Productivity",
        value: `${(Number(outcome.productivity ?? 0) * 100).toFixed(1)}%`,
      },
      {
        name: "Hiring quality",
        value: `${Number(outcome.hiring_quality ?? 0).toFixed(0)}/100`,
      },
      {
        name: "Turnover cost",
        value: formatCurrency(Number(outcome.turnover_cost ?? 0)),
      },
    ],
    financials: [
      { label: "Revenue", value: formatCurrency(Number(outcome.revenue)) },
      { label: "Profit", value: formatCurrency(Number(outcome.profit)) },
      { label: "Stock price", value: `$${Number(outcome.stock_price).toFixed(2)}` },
      { label: "Market share", value: formatPercent(Number(outcome.market_share)) },
      { label: "Headcount", value: String(outcome.headcount) },
    ],
    feedback,
  };
}
