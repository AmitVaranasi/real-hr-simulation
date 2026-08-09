/** Client-side visit tracking for HR Decision module green checks (PNG). */

const EVENT = "hr-module-visited";

function storageKey(roundId: string) {
  return `hr-module-visited:${roundId}`;
}

export function getVisitedModules(roundId: string | null | undefined): string[] {
  if (!roundId || typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(roundId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function markModuleVisited(roundId: string, tabKey: string) {
  if (typeof window === "undefined") return;
  const current = new Set(getVisitedModules(roundId));
  current.add(tabKey);
  localStorage.setItem(storageKey(roundId), JSON.stringify([...current]));
  window.dispatchEvent(
    new CustomEvent(EVENT, { detail: { roundId, tabKey } })
  );
}

export function subscribeModuleVisited(
  handler: (detail: { roundId: string; tabKey: string }) => void
) {
  if (typeof window === "undefined") return () => {};
  const fn = (e: Event) => {
    const detail = (e as CustomEvent).detail as {
      roundId: string;
      tabKey: string;
    };
    handler(detail);
  };
  window.addEventListener(EVENT, fn);
  return () => window.removeEventListener(EVENT, fn);
}
