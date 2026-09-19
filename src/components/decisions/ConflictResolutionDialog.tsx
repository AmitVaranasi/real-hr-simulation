"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  classifyDecision,
  conflictingFields,
  type ConflictReport,
} from "@/lib/decisions/conflict";
import type { Decision } from "@/lib/engine/types";

interface ConflictResolutionDialogProps {
  /** What the client loaded before editing. */
  base: Decision;
  /** The client's current local edits. */
  mine: Decision;
  /** The server's current row, returned in the 409 response. */
  theirs: Decision;
  /** Version on the server right now — send this back as `version` on retry. */
  serverVersion: number;
  /** Called with the merged decision once the student resolves every conflict. */
  onResolve: (merged: Decision, version: number) => void;
  onCancel: () => void;
}

function humanizeFieldName(key: string): string {
  return key
    .replace(/_json$/, "")
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

type Choice = "mine" | "theirs";

/**
 * Field-by-field conflict resolution surface, shown after a save gets a 409.
 * Non-conflicting fields are merged automatically (my exclusive edits are
 * kept, the teammate's exclusive edits are taken); only fields BOTH sides
 * changed to different values need a per-field choice from the student.
 */
export function ConflictResolutionDialog({
  base,
  mine,
  theirs,
  serverVersion,
  onResolve,
  onCancel,
}: ConflictResolutionDialogProps) {
  const report: ConflictReport = useMemo(
    () =>
      classifyDecision(
        base as unknown as Record<string, unknown>,
        mine as unknown as Record<string, unknown>,
        theirs as unknown as Record<string, unknown>
      ),
    [base, mine, theirs]
  );

  const conflicts = useMemo(() => conflictingFields(report), [report]);

  const [choices, setChoices] = useState<Record<string, Choice>>(() =>
    Object.fromEntries(conflicts.map((f) => [f, "theirs" as Choice]))
  );

  function setChoice(field: string, choice: Choice) {
    setChoices((prev) => ({ ...prev, [field]: choice }));
  }

  function buildMerged(): Decision {
    const mineRecord = mine as unknown as Record<string, unknown>;
    const theirsRecord = theirs as unknown as Record<string, unknown>;
    const merged: Record<string, unknown> = { ...mineRecord };

    for (const [field, classification] of Object.entries(report)) {
      if (classification === "changed-by-them-only") {
        merged[field] = theirsRecord[field];
      } else if (classification === "changed-by-both") {
        merged[field] =
          choices[field] === "mine" ? mineRecord[field] : theirsRecord[field];
      }
      // unchanged / changed-by-me-only: mine already holds the right value.
    }

    return merged as unknown as Decision;
  }

  if (conflicts.length === 0) {
    // Nothing needs a manual choice — the teammate's exclusive edits and my
    // exclusive edits can merge automatically.
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-900">
          A teammate saved changes while you were editing.
        </p>
        <p className="mt-1 text-sm text-amber-800">
          None of your edits touched the same fields, so they can be merged
          automatically.
        </p>
        <div className="mt-3 flex gap-2">
          <Button onClick={() => onResolve(buildMerged(), serverVersion)}>
            Merge &amp; Save
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
      <p className="text-sm font-semibold text-red-900">
        A teammate saved different changes to the same field
        {conflicts.length > 1 ? "s" : ""} while you were editing.
      </p>
      <p className="mt-1 text-sm text-red-800">
        Choose which value to keep for each field below. Everything else is
        merged automatically.
      </p>

      <ul className="mt-3 space-y-3">
        {conflicts.map((field) => (
          <li
            key={field}
            className="rounded-lg border border-[var(--portal-sidebar-border)] bg-white p-3"
          >
            <p className="text-sm font-semibold text-[var(--portal-ink)]">
              {humanizeFieldName(field)}
            </p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:gap-4">
              <label className="flex flex-1 items-start gap-2 text-sm">
                <input
                  type="radio"
                  name={`conflict-${field}`}
                  className="mt-1"
                  checked={choices[field] === "mine"}
                  onChange={() => setChoice(field, "mine")}
                />
                <span>
                  <span className="block font-medium text-[var(--portal-ink)]">
                    Keep mine
                  </span>
                  <span className="block text-[var(--portal-muted)]">
                    {displayValue((mine as unknown as Record<string, unknown>)[field])}
                  </span>
                </span>
              </label>
              <label className="flex flex-1 items-start gap-2 text-sm">
                <input
                  type="radio"
                  name={`conflict-${field}`}
                  className="mt-1"
                  checked={choices[field] === "theirs"}
                  onChange={() => setChoice(field, "theirs")}
                />
                <span>
                  <span className="block font-medium text-[var(--portal-ink)]">
                    Take teammate&apos;s
                  </span>
                  <span className="block text-[var(--portal-muted)]">
                    {displayValue(
                      (theirs as unknown as Record<string, unknown>)[field]
                    )}
                  </span>
                </span>
              </label>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex gap-2">
        <Button onClick={() => onResolve(buildMerged(), serverVersion)}>
          Resolve &amp; Save
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
