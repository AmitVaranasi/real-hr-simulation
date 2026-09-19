import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ResetStudentPasswordForm } from "../ResetStudentPasswordForm";

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body } as Response;
}

describe("ResetStudentPasswordForm", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("submits the entered email with the session id and shows a success message, clearing the field", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(jsonResponse({})))
    );
    const user = userEvent.setup();
    render(<ResetStudentPasswordForm sessionId="sess-9" />);

    const emailInput = screen.getByRole("textbox", { name: "Student email" });
    await user.type(emailInput, "student@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset" }));

    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/reset-student",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          email: "student@example.com",
          sessionId: "sess-9",
        }),
      })
    );
    expect(
      await screen.findByText("Password reset email sent.")
    ).toBeInTheDocument();
    expect(emailInput).toHaveValue("");
  });

  it("shows the server's error message and keeps the typed email when the request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(jsonResponse({ error: "No student with that email" }, false))
      )
    );
    const user = userEvent.setup();
    render(<ResetStudentPasswordForm sessionId="sess-9" />);

    const emailInput = screen.getByRole("textbox", { name: "Student email" });
    await user.type(emailInput, "missing@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset" }));

    expect(
      await screen.findByText("No student with that email")
    ).toBeInTheDocument();
    expect(emailInput).toHaveValue("missing@example.com");
    expect(
      screen.queryByText("Password reset email sent.")
    ).not.toBeInTheDocument();
  });

  it("falls back to a generic error message when the server sends no error body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(jsonResponse({}, false)))
    );
    const user = userEvent.setup();
    render(<ResetStudentPasswordForm sessionId="sess-9" />);
    await user.type(
      screen.getByRole("textbox", { name: "Student email" }),
      "x@example.com"
    );
    await user.click(screen.getByRole("button", { name: "Send reset" }));

    expect(
      await screen.findByText("Failed to send reset")
    ).toBeInTheDocument();
  });

  it("disables the submit button and shows the sending state while the request is in flight", async () => {
    let resolveFetch: (value: Response) => void = () => {};
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            resolveFetch = resolve;
          })
      )
    );
    const user = userEvent.setup();
    render(<ResetStudentPasswordForm sessionId="sess-9" />);
    await user.type(
      screen.getByRole("textbox", { name: "Student email" }),
      "x@example.com"
    );
    await user.click(screen.getByRole("button", { name: "Send reset" }));

    const sendingButton = screen.getByRole("button", { name: "Sending…" });
    expect(sendingButton).toBeDisabled();

    resolveFetch(jsonResponse({}));
    expect(
      await screen.findByRole("button", { name: "Send reset" })
    ).toBeEnabled();
  });
});
