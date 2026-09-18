export type ActivityItem = {
  id: string;
  message: string;
  created_at: string;
};

/**
 * Read-only "recent activity" list for the session page. Server-rendered —
 * the data comes from listSessionActivity() in the parent server component,
 * so there is no client-side fetch/useEffect to manage here.
 */
export function SessionActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-[var(--portal-muted)]">
        No activity yet. Leaves and roster moves will show up here.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item.id}
          className="rounded-md bg-[#f8f9fb] px-3 py-2 text-sm text-[var(--portal-ink)]"
        >
          <p>{item.message}</p>
          <p className="mt-0.5 text-[0.75rem] text-[var(--portal-muted)]">
            {new Date(item.created_at).toLocaleString()}
          </p>
        </li>
      ))}
    </ul>
  );
}
