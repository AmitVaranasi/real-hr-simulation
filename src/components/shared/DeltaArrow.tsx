import { ArrowDown, ArrowUp, Minus } from "lucide-react";

interface DeltaArrowProps {
  current: number;
  prior?: number;
  invertColor?: boolean;
  format?: "percent" | "number";
}

export function DeltaArrow({
  current,
  prior,
  invertColor = false,
  format = "percent",
}: DeltaArrowProps) {
  if (prior === undefined || prior === 0) {
    return <span className="text-xs text-[var(--portal-muted)]">—</span>;
  }
  const delta = ((current - prior) / Math.abs(prior)) * 100;
  const improved = invertColor ? delta < 0 : delta > 0;
  const worsened = invertColor ? delta > 0 : delta < 0;
  const color = improved
    ? "text-emerald-600"
    : worsened
      ? "text-red-600"
      : "text-[var(--portal-muted)]";
  const Icon = delta > 0 ? ArrowUp : delta < 0 ? ArrowDown : Minus;
  const label =
    format === "percent"
      ? `${Math.abs(delta).toFixed(1)}%`
      : `${(current - prior).toFixed(1)}`;

  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${color}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
