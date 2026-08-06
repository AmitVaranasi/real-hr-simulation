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
    <div className="rounded-lg border border-[var(--portal-sidebar-border)] bg-white p-4">
      <p className="text-xs text-[var(--portal-muted)]">{label}</p>
      <p className="text-lg font-semibold text-[var(--portal-title)]">{formatted}</p>
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
