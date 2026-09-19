import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ImpersonationBanner } from "../ImpersonationBanner";

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body } as Response;
}

describe("ImpersonationBanner", () => {
  let hrefSetter: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    // window.location.href is not implemented as an assignable property in
    // jsdom navigation by default; replace it so the exit flow is observable.
    hrefSetter = vi.fn();
    Object.defineProperty(window, "location", {
      value: { ...window.location },
      writable: true,
    });
    Object.defineProperty(window.location, "href", {
      set: hrefSetter,
      get: () => "",
      configurable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders nothing when no impersonation is active", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({ impersonating: false })
    );
    const { container } = render(<ImpersonationBanner />);
    await vi.waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing while the status check is still pending", () => {
    (fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));
    const { container } = render(<ImpersonationBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the banner with an exit action when impersonation is active", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({ impersonating: true })
    );
    render(<ImpersonationBanner />);
    expect(
      await screen.findByRole("button", { name: "Exit to admin" })
    ).toBeInTheDocument();
    expect(screen.getByText(/Impersonation active/)).toBeInTheDocument();
  });

  it("stays silent when the status check itself fails", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("down"));
    const { container } = render(<ImpersonationBanner />);
    await vi.waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
    expect(container).toBeEmptyDOMElement();
  });

  it("navigates home on a successful exit", async () => {
    const user = userEvent.setup();
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(jsonResponse({ impersonating: true }));
    render(<ImpersonationBanner />);
    await screen.findByRole("button", { name: "Exit to admin" });

    fetchMock.mockResolvedValueOnce(jsonResponse({ home: "/admin" }));
    await user.click(screen.getByRole("button", { name: "Exit to admin" }));

    await vi.waitFor(() => {
      expect(hrefSetter).toHaveBeenCalledWith("/admin");
    });
  });

  it("alerts and re-enables the button when exit fails", async () => {
    const user = userEvent.setup();
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(jsonResponse({ impersonating: true }));
    render(<ImpersonationBanner />);
    const exitBtn = await screen.findByRole("button", { name: "Exit to admin" });

    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "Exit failed" }, false));
    await user.click(exitBtn);

    await vi.waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Exit failed");
    });
    expect(
      screen.getByRole("button", { name: "Exit to admin" })
    ).not.toBeDisabled();
  });
});
