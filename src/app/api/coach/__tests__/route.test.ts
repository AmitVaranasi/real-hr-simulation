import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createHarness, authedContext } from "@/test/harness";

const harness = createHarness();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => harness.serverClient,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => harness.adminClient,
}));
vi.mock("@/lib/api/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/auth")>();
  return {
    ...actual,
    getAuthUser: harness.getAuthUser,
    requireAuth: harness.requireAuth,
  };
});

// Fake async-iterable Anthropic stream: yields two text deltas, then
// finalMessage() resolves with usage + stop_reason.
function makeFakeAnthropicStream(opts?: {
  stopReason?: string;
  chunks?: string[];
}) {
  const chunks = opts?.chunks ?? ["Hello ", "there."];
  const stopReason = opts?.stopReason ?? "end_turn";
  return {
    async *[Symbol.asyncIterator]() {
      for (const text of chunks) {
        yield { type: "content_block_delta", delta: { type: "text_delta", text } };
      }
    },
    finalMessage: async () => ({
      stop_reason: stopReason,
      usage: { input_tokens: 100, output_tokens: 20, cache_read_input_tokens: 50 },
    }),
  };
}

let fakeStreamFactory = () => makeFakeAnthropicStream();

class FakeAnthropic {
  static RateLimitError = class RateLimitError extends Error {};
  static APIError = class APIError extends Error {};
  messages = {
    stream: () => fakeStreamFactory(),
  };
}

vi.mock("@anthropic-ai/sdk", () => ({ default: FakeAnthropic }));

let POST: typeof import("@/app/api/coach/route").POST;
beforeAll(async () => {
  ({ POST } = await import("@/app/api/coach/route"));
});

beforeEach(() => {
  harness.reset();
  fakeStreamFactory = () => makeFakeAnthropicStream();
  process.env.ANTHROPIC_API_KEY = "test-key";
});

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/coach", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

const teamRow = {
  id: "team-1",
  name: "Team A",
  industry: "High-Tech",
  strategy: "Innovation",
};

describe("POST /api/coach", () => {
  it("401s when unauthenticated", async () => {
    const res = await POST(makeRequest({ team_id: "team-1", message: "hi" }));
    expect(res.status).toBe(401);
  });

  it("403s for instructors (students only)", async () => {
    harness.setAuth(authedContext("instructor"));
    const res = await POST(makeRequest({ team_id: "team-1", message: "hi" }));
    expect(res.status).toBe(403);
  });

  it("400s when message or team_id is missing", async () => {
    harness.setAuth(authedContext("student"));
    const res = await POST(makeRequest({ team_id: "team-1" }));
    expect(res.status).toBe(400);
  });

  it("403s when the student is not on the given team", async () => {
    harness.setAuth(authedContext("student"));
    harness.serverClient.queue("team_members", { data: null });
    const res = await POST(makeRequest({ team_id: "team-1", message: "hi" }));
    expect(res.status).toBe(403);
  });

  it("429s once the daily cap is reached, without calling the model", async () => {
    harness.setAuth(authedContext("student"));
    harness.serverClient.queue("team_members", { data: { id: "m1", teams: teamRow } });
    harness.serverClient.queue("coach_messages", { data: null, count: 20 });

    let called = false;
    fakeStreamFactory = () => {
      called = true;
      return makeFakeAnthropicStream();
    };

    const res = await POST(makeRequest({ team_id: "team-1", message: "hi" }));
    expect(res.status).toBe(429);
    expect(called).toBe(false);
  });

  it("503s gracefully when ANTHROPIC_API_KEY is absent", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    harness.setAuth(authedContext("student"));
    harness.serverClient.queue("team_members", { data: { id: "m1", teams: teamRow } });
    harness.serverClient.queue("coach_messages", { data: null, count: 0 });
    harness.serverClient.queue("decisions", { data: [] });
    harness.serverClient.queue("outcomes", { data: [] });

    const res = await POST(makeRequest({ team_id: "team-1", message: "hi" }));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toMatch(/not configured/i);
  });

  it("streams the model's text deltas back to the caller", async () => {
    harness.setAuth(authedContext("student"));
    harness.serverClient.queue("team_members", { data: { id: "m1", teams: teamRow } });
    harness.serverClient.queue("coach_messages", { data: null, count: 3 });
    harness.serverClient.queue("decisions", { data: [] });
    harness.serverClient.queue("outcomes", { data: [] });
    harness.serverClient.queue("coach_messages", { data: { id: "msg-1" } }); // user insert
    harness.serverClient.queue("coach_messages", { data: { id: "msg-2" } }); // assistant insert

    const res = await POST(makeRequest({ team_id: "team-1", message: "Why did my turnover rise?" }));
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toBe("Hello there.");
  });

  it("appends a refusal note instead of throwing when stop_reason is refusal", async () => {
    harness.setAuth(authedContext("student"));
    harness.serverClient.queue("team_members", { data: { id: "m1", teams: teamRow } });
    harness.serverClient.queue("coach_messages", { data: null, count: 1 });
    harness.serverClient.queue("decisions", { data: [] });
    harness.serverClient.queue("outcomes", { data: [] });
    harness.serverClient.queue("coach_messages", { data: { id: "msg-1" } });
    harness.serverClient.queue("coach_messages", { data: { id: "msg-2" } });

    fakeStreamFactory = () =>
      makeFakeAnthropicStream({ stopReason: "refusal", chunks: [] });

    const res = await POST(makeRequest({ team_id: "team-1", message: "Give me the answer key." }));
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toMatch(/declined to answer/i);
  });
});
