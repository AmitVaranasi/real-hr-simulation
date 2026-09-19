/**
 * API route test harness.
 *
 * Route handlers under src/app/api/** are awkward to unit test because they
 * reach for a real Supabase session (cookies + network) via
 * `@/lib/supabase/server`, a service-role client via `@/lib/supabase/admin`,
 * and the auth/role gates in `@/lib/api/auth`. This harness gives each test
 * file a fake in-memory stand-in for all three so a route handler can be
 * invoked directly with a plain `Request` and asserted on the `Response` it
 * returns, without touching a network or a real database.
 *
 * USAGE (per test file):
 *
 *   import { vi } from "vitest";
 *   import { createHarness } from "@/test/harness";
 *
 *   const harness = createHarness();
 *
 *   vi.mock("@/lib/supabase/server", () => ({
 *     createClient: async () => harness.serverClient,
 *   }));
 *   vi.mock("@/lib/supabase/admin", () => ({
 *     createAdminClient: () => harness.adminClient,
 *   }));
 *   vi.mock("@/lib/api/auth", async (importOriginal) => {
 *     const actual = await importOriginal<typeof import("@/lib/api/auth")>();
 *     return {
 *       ...actual,
 *       getAuthUser: harness.getAuthUser,
 *       requireAuth: harness.requireAuth,
 *       requireInstructor: harness.requireInstructor,
 *       requireInstructorOrAdmin: harness.requireInstructorOrAdmin,
 *       requireAdmin: harness.requireAdmin,
 *     };
 *   });
 *
 *   // Route modules must be imported dynamically, AFTER the mocks above are
 *   // registered, because `vi.mock` calls are hoisted above the harness
 *   // creation. A static `import { POST } from "route"` at file top would
 *   // resolve the route (and its unmocked dependencies) before `harness`
 *   // exists.
 *   let POST: typeof import("@/app/api/teams/join/route").POST;
 *   beforeAll(async () => {
 *     ({ POST } = await import("@/app/api/teams/join/route"));
 *   });
 *
 *   beforeEach(() => harness.reset());
 */

import { NextResponse } from "next/server";
import type { Profile } from "@/lib/engine/types";

export type Role = "student" | "instructor" | "admin";

export interface TestUser {
  id: string;
  email: string;
}

export type TestProfile = Profile & { id: string };

export interface AuthContext {
  user: TestUser | null;
  profile: TestProfile | null;
}

/** An unauthenticated caller: no Supabase session. */
export function unauthenticatedContext(): AuthContext {
  return { user: null, profile: null };
}

/** An authenticated caller with the given role and optional overrides. */
export function authedContext(
  role: Role,
  opts: { id?: string; email?: string; profileOverrides?: Partial<TestProfile> } = {}
): AuthContext {
  const id = opts.id ?? `user-${role}-1`;
  return {
    user: { id, email: opts.email ?? `${role}@example.com` },
    profile: {
      id,
      role,
      display_name: `Test ${role}`,
      ...opts.profileOverrides,
    } as TestProfile,
  };
}

// ---- Fake Supabase query builder -----------------------------------------

export interface QueuedResult<T = unknown> {
  data: T | null;
  error: { message: string } | null;
  count?: number | null;
}

const DEFAULT_RESULT: QueuedResult = { data: null, error: null };

/**
 * Chainable stand-in for the Supabase query builder. Supports the chains the
 * routes under test actually use: .select().eq().maybeSingle()/.single(),
 * .insert()/.update()/.delete()/.upsert(), .order(), and being awaited
 * directly without a terminal call (as the routes do for plain
 * selects/inserts/deletes that don't chain .single()).
 *
 * It does not validate filter values — it is a scripted stand-in, not a
 * database. Each `.from(table)` call drains one queued result per call, in
 * the order the test queued them via `harness.queue(table, result)`.
 */
class FakeQueryBuilder implements PromiseLike<QueuedResult> {
  private settled: Promise<QueuedResult> | null = null;

  constructor(
    private readonly queue: QueuedResult[],
    private readonly table: string
  ) {}

  select() {
    return this;
  }
  eq() {
    return this;
  }
  gte() {
    return this;
  }
  lte() {
    return this;
  }
  in() {
    return this;
  }
  order() {
    return this;
  }
  limit() {
    return this;
  }
  insert() {
    return this;
  }
  update() {
    return this;
  }
  upsert() {
    return this;
  }
  delete() {
    return this;
  }

  single() {
    return this.resolve();
  }
  maybeSingle() {
    return this.resolve();
  }

  private resolve(): Promise<QueuedResult> {
    if (!this.settled) {
      const next = this.queue.shift();
      // No result queued for this table/call: fall back to a benign empty
      // result rather than throwing, so unrelated calls (e.g. best-effort
      // audit-log inserts) don't blow up tests that never queued for them.
      this.settled = Promise.resolve(next ?? { ...DEFAULT_RESULT });
    }
    return this.settled;
  }

  then<TResult1 = QueuedResult, TResult2 = never>(
    onfulfilled?:
      | ((value: QueuedResult) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return this.resolve().then(onfulfilled, onrejected);
  }
}

export class FakeSupabaseClient {
  private tables = new Map<string, QueuedResult[]>();

  auth = {
    getUser: async () => ({ data: { user: null }, error: null }) as {
      data: { user: unknown };
      error: unknown;
    },
    getSession: async () => ({
      data: { session: null as unknown },
      error: null as unknown,
    }),
    exchangeCodeForSession: async () => ({
      data: { session: null as unknown, user: null as unknown },
      error: null as unknown,
    }),
    admin: {
      listUsers: async () => ({
        data: { users: [] as unknown[] },
        error: null as unknown,
      }),
      updateUserById: async () => ({
        data: {},
        error: null as unknown,
      }),
      getUserById: async () => ({
        data: { user: null as unknown },
        error: null as unknown,
      }),
      generateLink: async () => ({
        data: { properties: null as unknown },
        error: null as unknown,
      }),
    },
    resetPasswordForEmail: async () => ({
      error: null as unknown,
    }),
  };

  from(table: string) {
    const q = this.tables.get(table) ?? [];
    this.tables.set(table, q);
    return new FakeQueryBuilder(q, table);
  }

  /** Queue the next result `.from(table)...` resolves to (FIFO per table). */
  queue<T = unknown>(table: string, result: Partial<QueuedResult<T>>) {
    const q = this.tables.get(table) ?? [];
    q.push({ data: null, error: null, ...result } as QueuedResult);
    this.tables.set(table, q);
    return this;
  }

  reset() {
    this.tables.clear();
  }
}

// ---- Harness ---------------------------------------------------------------

function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
function forbiddenResponse() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export function createHarness() {
  const serverClient = new FakeSupabaseClient();
  const adminClient = new FakeSupabaseClient();
  let auth: AuthContext = unauthenticatedContext();

  function bundle(error: NextResponse | null) {
    return { error, user: auth.user, profile: auth.profile, supabase: serverClient };
  }

  return {
    serverClient,
    adminClient,

    /** Set the caller for subsequent guard calls in this test. */
    setAuth(ctx: AuthContext) {
      auth = ctx;
    },
    getAuth() {
      return auth;
    },

    /** Clears queued table results and resets to unauthenticated. */
    reset() {
      serverClient.reset();
      adminClient.reset();
      auth = unauthenticatedContext();
    },

    // These mirror src/lib/api/auth.ts's own gate semantics (401 when no
    // user, 403 when the role doesn't match) so route tests exercise the
    // same status codes a real regression there would break, while letting
    // tests drive the caller's identity without a real Supabase session.
    getAuthUser: async () => ({
      user: auth.user,
      profile: auth.profile,
      supabase: serverClient,
    }),
    requireAuth: async () => {
      if (!auth.user) return bundle(unauthorizedResponse());
      return bundle(null);
    },
    requireInstructor: async () => {
      if (!auth.user) return bundle(unauthorizedResponse());
      if (auth.profile?.role !== "instructor") return bundle(forbiddenResponse());
      return bundle(null);
    },
    requireInstructorOrAdmin: async () => {
      if (!auth.user) return bundle(unauthorizedResponse());
      const role = auth.profile?.role;
      if (role !== "instructor" && role !== "admin") return bundle(forbiddenResponse());
      return bundle(null);
    },
    requireAdmin: async () => {
      if (!auth.user) return bundle(unauthorizedResponse());
      if (auth.profile?.role !== "admin") return bundle(forbiddenResponse());
      return bundle(null);
    },
  };
}

export type Harness = ReturnType<typeof createHarness>;
