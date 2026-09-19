import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WorkforceBriefClient } from "../WorkforceBriefClient";

// WorkforceBriefView is the 850-line presentational component tested in its
// own file; here it's mocked to a stub that exposes the two callback props
// WorkforceBriefClient wires up (onSaveReflection / onDownloadPdf), since
// this component's only job is that wiring, not the view itself.
vi.mock("../WorkforceBriefView", () => ({
  WorkforceBriefView: (props: {
    data: {
      onSaveReflection?: (content: string) => Promise<void>;
      onDownloadPdf?: () => void;
    };
  }) => (
    <div>
      <button
        onClick={() =>
          props.data.onSaveReflection?.("my reflection").catch(() => {
            /* swallowed for the test — save-failure paths assert on fetch/reload instead */
          })
        }
        disabled={!props.data.onSaveReflection}
      >
        save
      </button>
      <button
        onClick={() => props.data.onDownloadPdf?.()}
        disabled={!props.data.onDownloadPdf}
      >
        download
      </button>
    </div>
  ),
}));

// jspdf/xlsx are mocked out entirely — we only assert the download handler is
// wired and invokes them, not what they produce.
const generateTeamPdf = vi.fn();
const outcomeToPdfData = vi.fn((...args: unknown[]) => {
  void args;
  return {
    sessionName: "s",
    teamName: "t",
    industry: "i",
    strategy: "st",
    roundNumber: 1,
    bsc: { financial: 0, employee: 0, process: 0, learning: 0, total: 0 },
    metrics: [],
    financials: [],
  };
});
vi.mock("@/lib/export/pdf", () => ({
  generateTeamPdf: (...args: unknown[]) => generateTeamPdf(...args),
  outcomeToPdfData: (...args: unknown[]) => outcomeToPdfData(...args),
}));

const team = { name: "Team A", industry: "Retail", strategy: "Focus" };

describe("WorkforceBriefClient — reflection save wiring", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("does not offer onSaveReflection when teamId or roundId is missing", () => {
    render(<WorkforceBriefClient data={{}} />);
    expect(screen.getByRole("button", { name: "save" })).toBeDisabled();
  });

  it("POSTs to /api/reflections with the team/round/content and reloads on success", async () => {
    // jsdom's window.location (and its reload method) is non-configurable
    // in place, so swap the whole global instead of patching one property.
    const reloadSpy = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { reload: reloadSpy },
    });

    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    render(
      <WorkforceBriefClient data={{}} teamId="team-1" roundId="round-1" />
    );
    screen.getByRole("button", { name: "save" }).click();
    await vi.waitFor(() => expect(fetch).toHaveBeenCalled());

    expect(fetch).toHaveBeenCalledWith(
      "/api/reflections",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          team_id: "team-1",
          round_id: "round-1",
          content: "my reflection",
        }),
      })
    );
    await vi.waitFor(() => expect(reloadSpy).toHaveBeenCalled());
  });

  it("does not reload the page when the API responds with a non-ok status", async () => {
    // jsdom's window.location (and its reload method) is non-configurable
    // in place, so swap the whole global instead of patching one property.
    const reloadSpy = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { reload: reloadSpy },
    });

    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Round is closed" }),
    });

    render(
      <WorkforceBriefClient data={{}} teamId="team-1" roundId="round-1" />
    );
    screen.getByRole("button", { name: "save" }).click();
    await vi.waitFor(() => expect(fetch).toHaveBeenCalled());
    // Give the rejected handleSaveReflection promise a tick to settle before
    // asserting reload was never reached.
    await new Promise((r) => setTimeout(r, 0));
    expect(reloadSpy).not.toHaveBeenCalled();
  });
});

describe("WorkforceBriefClient — PDF download wiring", () => {
  beforeEach(() => {
    generateTeamPdf.mockClear();
    outcomeToPdfData.mockClear();
  });

  it("does not offer onDownloadPdf when outcome, team or sessionName is missing", () => {
    render(<WorkforceBriefClient data={{}} />);
    expect(screen.getByRole("button", { name: "download" })).toBeDisabled();
  });

  it("builds pdf data via outcomeToPdfData and calls generateTeamPdf when all three are present", () => {
    render(
      <WorkforceBriefClient
        data={{ roundNumber: 3 }}
        team={team}
        sessionName="Session 1"
        outcome={{ total_score: 90 }}
      />
    );
    screen.getByRole("button", { name: "download" }).click();
    expect(outcomeToPdfData).toHaveBeenCalledWith(
      "Session 1",
      team,
      3,
      { total_score: 90 }
    );
    expect(generateTeamPdf).toHaveBeenCalledTimes(1);
  });

  it("attaches reflectionContent onto the generated pdf data when present", () => {
    render(
      <WorkforceBriefClient
        data={{ roundNumber: 1, reflectionContent: "Our approach was..." }}
        team={team}
        sessionName="Session 1"
        outcome={{}}
      />
    );
    screen.getByRole("button", { name: "download" }).click();
    const [pdfArg] = generateTeamPdf.mock.calls[0];
    expect(pdfArg.reflection).toBe("Our approach was...");
  });
});
