import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnnouncementsHub } from "../AnnouncementsHub";
import type { CourseRailState } from "../ProfessorChrome";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
}));

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body } as Response;
}

const RAIL: CourseRailState = {
  sessionId: "sess-1",
  practiceOpen: true,
  competitiveRounds: 6,
  studentsEnrolled: 40,
  teamsCreated: 8,
  roundsCompleted: 2,
  nextRoundLabel: "Round 3",
};

describe("AnnouncementsHub", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(jsonResponse({ announcement: "Posted" })))
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the posted announcement in the table when one exists and the form is closed", () => {
    render(
      <AnnouncementsHub
        sessionId="sess-1"
        announcement="Midterm decisions due Friday"
        updatedAt="2026-01-05T12:00:00.000Z"
        rail={RAIL}
      />
    );
    expect(
      screen.getByRole("cell", { name: /Midterm decisions due Friday/ })
    ).toBeInTheDocument();
    // No announcement yet posted -> input is not shown by default when one exists.
    expect(
      screen.queryByRole("textbox", { name: /announcement/i })
    ).not.toBeInTheDocument();
  });

  it("opens the composer by default when there is no posted announcement, showing the empty-state row instead", () => {
    render(
      <AnnouncementsHub sessionId="sess-1" announcement={null} rail={RAIL} />
    );
    expect(screen.getByText("No announcement posted.")).toBeInTheDocument();
    expect(screen.getByText("New announcement")).toBeInTheDocument();
  });

  it("filters the announcement out of the table when the search query does not match", async () => {
    const user = userEvent.setup();
    render(
      <AnnouncementsHub
        sessionId="sess-1"
        announcement="Midterm decisions due Friday"
        rail={RAIL}
      />
    );
    const search = screen.getByPlaceholderText("Search announcements...");
    await user.type(search, "nonexistent topic");
    expect(screen.getByText("No announcement posted.")).toBeInTheDocument();

    await user.clear(search);
    expect(
      screen.getByRole("cell", { name: /Midterm decisions due Friday/ })
    ).toBeInTheDocument();
  });

  it("filtering by a non-matching announcement type also empties the table", async () => {
    const user = userEvent.setup();
    render(
      <AnnouncementsHub
        sessionId="sess-1"
        announcement="Midterm decisions due Friday"
        rail={RAIL}
      />
    );
    // NOTE: a11y gap — AnnouncementsHub.tsx:250-272 renders the type and
    // round filter <select> elements with no <label> or aria-label, so
    // neither has an accessible name. Falling back to index-based lookup.
    const [typeSelect] = screen.getAllByRole("combobox");
    await user.selectOptions(typeSelect, "reminder");
    expect(screen.getByText("No announcement posted.")).toBeInTheDocument();
  });

  it("switches to the Scheduled tab and shows its own empty-state copy, since scheduling has no store", async () => {
    const user = userEvent.setup();
    render(
      <AnnouncementsHub
        sessionId="sess-1"
        announcement="Midterm decisions due Friday"
        rail={RAIL}
      />
    );
    await user.click(screen.getByRole("link", { name: "Scheduled" }));
    expect(
      screen.getByRole("heading", { name: "Scheduled Announcements" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/No scheduled announcements/)
    ).toBeInTheDocument();
  });

  it("opens the composer from the header's New Announcement action and posts through the session PATCH endpoint", async () => {
    const user = userEvent.setup();
    render(
      <AnnouncementsHub
        sessionId="sess-1"
        announcement="Midterm decisions due Friday"
        rail={RAIL}
      />
    );
    await user.click(
      screen.getByRole("button", { name: "+ New Announcement" })
    );
    const textbox = screen.getByRole("textbox", {
      name: /Announcement \(shown on student dashboard\)/,
    });
    await user.clear(textbox);
    await user.type(textbox, "New message for the class");

    const postButton = screen.getByRole("button", { name: /post/i });
    await user.click(postButton);

    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/sessions/sess-1",
      expect.objectContaining({ method: "PATCH" })
    );
  });

  it("gives the announcement-actions menu button an accessible name", () => {
    render(
      <AnnouncementsHub
        sessionId="sess-1"
        announcement="Midterm decisions due Friday"
        rail={RAIL}
      />
    );
    expect(
      screen.getByRole("button", { name: "Announcement actions" })
    ).toBeInTheDocument();
  });
});
