import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HRCoach } from "../HRCoach";

function streamingResponse(chunks: string[], ok = true, status = 200) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
  return {
    ok,
    status,
    body: stream,
    json: async () => ({ error: "boom" }),
  } as unknown as Response;
}

describe("HRCoach", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders starter prompts and the message input", () => {
    render(<HRCoach teamId="team-1" roundId="round-1" />);
    expect(screen.getByText("Why did my score change this round?")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ask the HR Coach…")).toBeInTheDocument();
  });

  it("sends a message and streams the assistant reply into view", async () => {
    const user = userEvent.setup();
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      streamingResponse(["Hello ", "there."])
    );

    render(<HRCoach teamId="team-1" roundId="round-1" />);
    await user.type(screen.getByPlaceholderText("Ask the HR Coach…"), "Why did turnover rise?");
    await user.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText("Hello there.")).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/coach",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("team-1"),
      })
    );
  });

  it("shows a server-provided error message when the request fails", async () => {
    const user = userEvent.setup();
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      streamingResponse([], false, 429)
    );

    render(<HRCoach teamId="team-1" roundId="round-1" />);
    await user.type(screen.getByPlaceholderText("Ask the HR Coach…"), "hi");
    await user.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("boom");
    });
  });

  it("clicking a starter prompt sends it as a message", async () => {
    const user = userEvent.setup();
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      streamingResponse(["Good question."])
    );

    render(<HRCoach teamId="team-1" />);
    await user.click(screen.getByText("What should I consider for next round?"));

    await waitFor(() => {
      expect(screen.getByText("Good question.")).toBeInTheDocument();
    });
  });
});
