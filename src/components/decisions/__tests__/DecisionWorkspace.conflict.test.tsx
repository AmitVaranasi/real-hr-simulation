import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DecisionWorkspace } from "../DecisionWorkspace";
import { createDefaultDecision } from "@/lib/engine/defaults";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/round/r1/decisions",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const base = createDefaultDecision();

afterEach(() => {
  vi.unstubAllGlobals();
});

async function editOnboardingInvestment(user: ReturnType<typeof userEvent.setup>) {
  const input = screen.getByDisplayValue(String(base.onboarding_investment));
  await user.clear(input);
  await user.type(input, "750");
}

/** Only the /api/decisions calls — useSimulationConfig also calls fetch on mount. */
function decisionsCalls(fetchMock: ReturnType<typeof vi.fn>) {
  return fetchMock.mock.calls.filter(
    (call: unknown[]) => call[0] === "/api/decisions"
  );
}

describe("DecisionWorkspace conflict handling", () => {
  it("auto-merges without a per-field choice when the teammate's edit touched a different field", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      status: 409,
      ok: false,
      json: async () => ({
        error: "conflict",
        serverDecision: { ...base, benefits_pct: 18 },
        serverVersion: 3,
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <DecisionWorkspace
        teamId="t1"
        roundId="r1"
        industry="Manufacturing"
        strategy="Cost Leadership"
        economy="normal"
        initialDecision={{ ...base, version: 1 }}
        roundOpen
      />
    );

    await screen.findByRole("heading", { level: 1, name: "Recruitment & Selection" });
    await user.click(screen.getByRole("button", { name: "Save Now" }));

    await waitFor(() =>
      expect(screen.getByText(/can be merged automatically/i)).toBeInTheDocument()
    );

    const [call] = decisionsCalls(fetchMock);
    const sentBody = JSON.parse((call[1] as RequestInit).body as string);
    expect(sentBody.version).toBe(1);
  });

  it("surfaces a per-field choice for a true conflict and resolves at the server's version", async () => {
    const user = userEvent.setup();
    let decisionsCallCount = 0;
    const fetchMock = vi.fn(async (url: string) => {
      if (url !== "/api/decisions") {
        return { status: 200, ok: false, json: async () => ({}) };
      }
      decisionsCallCount += 1;
      if (decisionsCallCount === 1) {
        return {
          status: 409,
          ok: false,
          json: async () => ({
            error: "conflict",
            serverDecision: { ...base, onboarding_investment: 900 },
            serverVersion: 3,
          }),
        };
      }
      return {
        status: 200,
        ok: true,
        json: async () => ({
          decision: { ...base, onboarding_investment: 900, version: 4 },
        }),
      };
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <DecisionWorkspace
        teamId="t1"
        roundId="r1"
        industry="Manufacturing"
        strategy="Cost Leadership"
        economy="normal"
        initialDecision={{ ...base, version: 1 }}
        roundOpen
      />
    );

    await screen.findByRole("heading", { level: 1, name: "Recruitment & Selection" });
    await editOnboardingInvestment(user);
    await user.click(screen.getByRole("button", { name: "Save Now" }));

    await waitFor(() =>
      expect(
        screen.getByText(/teammate saved different changes/i)
      ).toBeInTheDocument()
    );
    expect(screen.getByText("Onboarding Investment")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /resolve & save/i }));

    await waitFor(() => expect(decisionsCalls(fetchMock)).toHaveLength(2));
    const [, secondCall] = decisionsCalls(fetchMock);
    const secondBody = JSON.parse((secondCall[1] as RequestInit).body as string);
    expect(secondBody.version).toBe(3); // resolved at the server's version

    await waitFor(() =>
      expect(
        screen.queryByText(/teammate saved different changes/i)
      ).not.toBeInTheDocument()
    );
  });
});
