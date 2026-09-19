/**
 * A minimal in-memory stand-in for the `decisions` table, used only by
 * tests in this directory that need real read-your-write persistence across
 * two sequential POST /api/decisions calls (the shared `src/test/harness.ts`
 * FakeSupabaseClient is a scripted per-call queue and does not persist
 * state, which makes it unsuitable for reproducing a concurrent-write bug).
 *
 * This fake mimics the trigger added in
 * supabase/migration-v11-decision-version.sql: every INSERT sets version=1,
 * every UPDATE increments the existing version unconditionally, regardless
 * of what the caller's payload contains.
 */

export interface FakeDecisionRow {
  [key: string]: unknown;
  team_id: string;
  round_id: string;
  version: number;
  last_edited_by: string | null;
}

export class FakeDecisionsTable {
  private rows = new Map<string, FakeDecisionRow>();

  private key(teamId: string, roundId: string) {
    return `${teamId}::${roundId}`;
  }

  get(teamId: string, roundId: string): FakeDecisionRow | null {
    return this.rows.get(this.key(teamId, roundId)) ?? null;
  }

  /** Mimics the BEFORE INSERT/UPDATE trigger: version is never trusted from the payload. */
  upsert(row: {
    team_id: string;
    round_id: string;
    last_edited_by: string | null;
    [key: string]: unknown;
  }): FakeDecisionRow {
    const k = this.key(row.team_id, row.round_id);
    const existing = this.rows.get(k);
    const next = {
      ...row,
      version: existing ? existing.version + 1 : 1,
    } as FakeDecisionRow;
    this.rows.set(k, next);
    return next;
  }

  reset() {
    this.rows.clear();
  }
}

/**
 * Builds a `.from(table)`-compatible chainable object backed by
 * `FakeDecisionsTable` for the `decisions` table, and simple canned
 * responses for `team_members` / `rounds` so route.ts's guard checks pass.
 */
export function fakeDecisionsSupabaseClient(table: FakeDecisionsTable) {
  return {
    from(name: string) {
      if (name === "team_members") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: { id: "m1" }, error: null }),
              }),
            }),
          }),
        };
      }
      if (name === "rounds") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: { status: "open" }, error: null }),
            }),
          }),
        };
      }
      if (name === "decisions") {
        let filters: { team_id?: string; round_id?: string } = {};
        const builder = {
          select: () => builder,
          eq: (col: string, val: string) => {
            filters = { ...filters, [col]: val };
            return builder;
          },
          maybeSingle: async () => {
            const row = table.get(
              filters.team_id ?? "",
              filters.round_id ?? ""
            );
            return { data: row, error: null };
          },
          upsert: (row: {
            team_id: string;
            round_id: string;
            last_edited_by: string | null;
            [key: string]: unknown;
          }) => ({
            select: () => ({
              single: async () => ({
                data: table.upsert(row),
                error: null,
              }),
            }),
          }),
        };
        return builder;
      }
      throw new Error(`fake client: unexpected table "${name}"`);
    },
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
    },
  };
}
