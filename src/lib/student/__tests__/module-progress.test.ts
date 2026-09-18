import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getVisitedModules,
  markModuleVisited,
  subscribeModuleVisited,
} from "../module-progress";

/**
 * vitest.config.ts runs this suite under environment "node" and jsdom is not
 * installed, so `window`/`localStorage`/CustomEvent are stubbed by hand.
 */
class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
  clear() {
    this.store.clear();
  }
}

class FakeEventTarget {
  private listeners = new Map<string, Set<(e: Event) => void>>();
  addEventListener(type: string, fn: (e: Event) => void) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(fn);
  }
  removeEventListener(type: string, fn: (e: Event) => void) {
    this.listeners.get(type)?.delete(fn);
  }
  dispatchEvent(e: Event) {
    this.listeners.get((e as unknown as { type: string }).type)?.forEach((fn) => fn(e));
    return true;
  }
}

class FakeCustomEvent {
  type: string;
  detail: unknown;
  constructor(type: string, opts?: { detail?: unknown }) {
    this.type = type;
    this.detail = opts?.detail;
  }
}

let storage: MemoryStorage;
let fakeWindow: FakeEventTarget;

beforeEach(() => {
  storage = new MemoryStorage();
  fakeWindow = new FakeEventTarget();
  vi.stubGlobal("window", fakeWindow);
  vi.stubGlobal("localStorage", storage);
  vi.stubGlobal("CustomEvent", FakeCustomEvent);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getVisitedModules", () => {
  it("returns an empty array when window is unavailable (SSR)", () => {
    vi.stubGlobal("window", undefined);
    expect(getVisitedModules("round-1")).toEqual([]);
  });

  it("returns an empty array for a null/undefined roundId", () => {
    expect(getVisitedModules(null)).toEqual([]);
    expect(getVisitedModules(undefined)).toEqual([]);
  });

  it("returns an empty array when nothing is stored", () => {
    expect(getVisitedModules("round-1")).toEqual([]);
  });

  it("recovers from corrupt JSON instead of throwing", () => {
    storage.setItem("hr-module-visited:round-1", "{not json");
    expect(getVisitedModules("round-1")).toEqual([]);
  });

  it("filters out non-string entries from a malformed stored array", () => {
    storage.setItem(
      "hr-module-visited:round-1",
      JSON.stringify(["recruitment", 42, null, "training"])
    );
    expect(getVisitedModules("round-1")).toEqual(["recruitment", "training"]);
  });

  it("returns an empty array when the stored JSON is not an array", () => {
    storage.setItem("hr-module-visited:round-1", JSON.stringify({ foo: "bar" }));
    expect(getVisitedModules("round-1")).toEqual([]);
  });
});

describe("markModuleVisited", () => {
  it("persists a visited tab and dedupes repeat visits", () => {
    markModuleVisited("round-1", "recruitment");
    markModuleVisited("round-1", "recruitment");
    markModuleVisited("round-1", "training");
    expect(getVisitedModules("round-1")).toEqual(["recruitment", "training"]);
  });

  it("scopes visited modules per roundId", () => {
    markModuleVisited("round-1", "recruitment");
    markModuleVisited("round-2", "training");
    expect(getVisitedModules("round-1")).toEqual(["recruitment"]);
    expect(getVisitedModules("round-2")).toEqual(["training"]);
  });

  it("broadcasts a CustomEvent with the roundId/tabKey detail", () => {
    const handler = vi.fn();
    fakeWindow.addEventListener("hr-module-visited", handler);
    markModuleVisited("round-1", "recruitment");
    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0] as { detail: unknown };
    expect(event.detail).toEqual({ roundId: "round-1", tabKey: "recruitment" });
  });
});

describe("subscribeModuleVisited", () => {
  it("invokes the handler with the event detail on visit", () => {
    const handler = vi.fn();
    subscribeModuleVisited(handler);
    markModuleVisited("round-1", "recruitment");
    expect(handler).toHaveBeenCalledWith({ roundId: "round-1", tabKey: "recruitment" });
  });

  it("returns an unsubscribe function that stops further notifications", () => {
    const handler = vi.fn();
    const unsubscribe = subscribeModuleVisited(handler);
    unsubscribe();
    markModuleVisited("round-1", "recruitment");
    expect(handler).not.toHaveBeenCalled();
  });

  it("returns a no-op unsubscribe when window is unavailable (SSR)", () => {
    vi.stubGlobal("window", undefined);
    const unsubscribe = subscribeModuleVisited(vi.fn());
    expect(() => unsubscribe()).not.toThrow();
  });
});
