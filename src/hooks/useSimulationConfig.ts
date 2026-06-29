"use client";

import { useEffect, useState } from "react";
import {
  setRuntimeSimulationConfig,
  type SimulationConfigDocument,
} from "@/lib/engine/simulation-config";

/** Loads professor-editable engine overrides for client-side simulation previews. */
export function useSimulationConfig() {
  const [ready, setReady] = useState(false);
  const [config, setConfig] = useState<SimulationConfigDocument | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/simulation-config/effective");
        if (!res.ok) {
          setRuntimeSimulationConfig(null);
          if (!cancelled) setReady(true);
          return;
        }
        const data = await res.json();
        const doc = data.config as SimulationConfigDocument;
        setRuntimeSimulationConfig(doc);
        if (!cancelled) {
          setConfig(doc);
          setReady(true);
        }
      } catch {
        setRuntimeSimulationConfig(null);
        if (!cancelled) setReady(true);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { ready, config };
}
