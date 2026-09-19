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

/**
 * useSyncExternalStore support.
 *
 * getVisitedModules builds a fresh array per call, which useSyncExternalStore
 * reads as a changed snapshot on every render and loops forever. These wrap it
 * with a cache keyed on the raw stored string, so the reference only changes
 * when the stored value actually does.
 */

const EMPTY_SNAPSHOT: string[] = [];

let snapshot: { roundId: string; raw: string; value: string[] } | null = null;

/** Stable-reference snapshot for the client. */
export function getVisitedModulesSnapshot(
  roundId: string | null | undefined
): string[] {
  if (!roundId || typeof window === "undefined") return EMPTY_SNAPSHOT;

  let raw: string;
  try {
    raw = localStorage.getItem(storageKey(roundId)) ?? "";
  } catch {
    return EMPTY_SNAPSHOT;
  }

  if (snapshot && snapshot.roundId === roundId && snapshot.raw === raw) {
    return snapshot.value;
  }

  const value = getVisitedModules(roundId);
  snapshot = { roundId, raw, value };
  return value;
}

/**
 * Server snapshot. Always empty: visits live in localStorage, so the server
 * cannot know them and must render the unvisited state for hydration to match.
 */
export function getVisitedModulesServerSnapshot(): string[] {
  return EMPTY_SNAPSHOT;
}

/** Subscribe to visits for one round, in the shape useSyncExternalStore wants. */
export function subscribeVisitedModules(
  roundId: string | null | undefined,
  onChange: () => void
): () => void {
  if (!roundId) return () => {};
  return subscribeModuleVisited((detail) => {
    if (detail.roundId === roundId) onChange();
  });
}
