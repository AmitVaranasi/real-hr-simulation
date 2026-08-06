import { formatCurrency } from "@/lib/utils";

interface MetricPreviewProps {
  items: Array<{ label: string; value: string }>;
}

export function MetricPreview({ items }: MetricPreviewProps) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-lg border border-[var(--portal-primary)]/30 bg-[var(--portal-primary-soft)]/70 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--portal-primary)]">
        Decision Impact Preview
      </p>
      <dl className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="flex justify-between gap-2">
            <dt className="text-[var(--portal-muted)]">{item.label}</dt>
            <dd className="font-medium text-[var(--portal-title)]">{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function formatPreviewCurrency(value: number): string {
  return formatCurrency(value);
}
