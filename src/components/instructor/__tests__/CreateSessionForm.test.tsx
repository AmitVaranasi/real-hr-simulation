import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CreateSessionForm } from "../CreateSessionForm";

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body } as Response;
}

describe("CreateSessionForm", () => {
  beforeEach(() => {
    push.mockClear();
    refresh.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("updates the practice/competitive round summary live as the number inputs change", async () => {
    const user = userEvent.setup();
    render(<CreateSessionForm />);
    expect(
      screen.getByText("Creates 1 practice + 3 competitive rounds (4 total).")
    ).toBeInTheDocument();

    const competitive = screen.getByRole("spinbutton", { name: "Competitive rounds" });
    await user.clear(competitive);
    await user.type(competitive, "6");

    expect(
      screen.getByText("Creates 1 practice + 6 competitive rounds (7 total).")
    ).toBeInTheDocument();
  });

  it("omits blank optional fields and sends round counts as numbers on submit", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(jsonResponse({ session: { id: "sess-42" } }))
      )
    );
    const user = userEvent.setup();
    render(<CreateSessionForm />);

    await user.type(
      screen.getByRole("textbox", { name: "Session name" }),
      "MGMT 453"
    );
    await user.click(screen.getByRole("button", { name: "Create session" }));

    expect(fetch).toHaveBeenCalledWith(
      "/api/sessions",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          name: "MGMT 453",
          course_code: undefined,
          semester: undefined,
          practice_rounds: 1,
          rounds_total: 3,
        }),
      })
    );
    expect(push).toHaveBeenCalledWith("/sessions/sess-42");
    expect(refresh).toHaveBeenCalled();
  });

  it("includes course code and semester when provided", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(jsonResponse({ session: { id: "sess-42" } }))
      )
    );
    const user = userEvent.setup();
    render(<CreateSessionForm />);

    await user.type(
      screen.getByRole("textbox", { name: "Session name" }),
      "MGMT 453"
    );
    await user.type(
      screen.getByRole("textbox", { name: "Course code (optional)" }),
      "MGMT453"
    );
    await user.type(
      screen.getByRole("textbox", { name: "Semester (optional)" }),
      "Fall 2026"
    );
    await user.click(screen.getByRole("button", { name: "Create session" }));

    expect(fetch).toHaveBeenCalledWith(
      "/api/sessions",
      expect.objectContaining({
        body: JSON.stringify({
          name: "MGMT 453",
          course_code: "MGMT453",
          semester: "Fall 2026",
          practice_rounds: 1,
          rounds_total: 3,
        }),
      })
    );
  });

  it("shows the server error and does not navigate when creation fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(jsonResponse({ error: "A session with that name already exists" }, false))
      )
    );
    const user = userEvent.setup();
    render(<CreateSessionForm />);

    await user.type(
      screen.getByRole("textbox", { name: "Session name" }),
      "Dup Session"
    );
    await user.click(screen.getByRole("button", { name: "Create session" }));

    expect(
      await screen.findByText("A session with that name already exists")
    ).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Create session" })
    ).toBeEnabled();
  });
});
