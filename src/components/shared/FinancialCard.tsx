import { DeltaArrow } from "@/components/shared/DeltaArrow";
import { formatCurrency, formatPercent } from "@/lib/utils";

interface FinancialCardProps {
  label: string;
  value: number;
  priorValue?: number;
  format?: "currency" | "percent" | "number";
  invertDelta?: boolean;
}

export function FinancialCard({
  label,
  value,
  priorValue,
  format = "currency",
  invertDelta = false,
}: FinancialCardProps) {
  const formatted =
    format === "currency"
      ? formatCurrency(value)
      : format === "percent"
        ? formatPercent(value)
        : value.toLocaleString();

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-semibold text-slate-900">{formatted}</p>
      {priorValue !== undefined && (
        <DeltaArrow
          current={value}
          prior={priorValue}
          invertColor={invertDelta}
        />
      )}
    </div>
  );
}
