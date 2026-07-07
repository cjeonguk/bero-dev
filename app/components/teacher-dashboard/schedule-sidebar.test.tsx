import { describe, expect, it } from "vitest";

import {
  getDateNavigationHref,
  isSessionSelectionActive,
  getSessionSelectionHref,
} from "./schedule-sidebar.helpers";

describe("ScheduleSidebar helpers", () => {
  it("builds a session selection href", () => {
    expect(getSessionSelectionHref("session-2", "2026-07-03")).toBe(
      "/teacher/dashboard/session-2?date=2026-07-03",
    );
  });

  it("builds date navigation hrefs to the dashboard index", () => {
    expect(
      getDateNavigationHref({
        date: "2026-07-03",
        direction: "previous",
      }),
    ).toBe("/teacher/dashboard?date=2026-07-02");
    expect(
      getDateNavigationHref({
        date: "2026-07-03",
        direction: "next",
      }),
    ).toBe("/teacher/dashboard?date=2026-07-04");
  });

  it("treats the matching session path as active without loader state", () => {
    expect(
      isSessionSelectionActive({
        currentPathname: "/teacher/dashboard/session-2",
        currentSearch: "?date=2026-07-03",
        sessionId: "session-2",
        selectedDate: "2026-07-03",
      }),
    ).toBe(true);

    expect(
      isSessionSelectionActive({
        currentPathname: "/teacher/dashboard/session-1",
        currentSearch: "?date=2026-07-03",
        sessionId: "session-2",
        selectedDate: "2026-07-03",
      }),
    ).toBe(false);
  });

  it("requires the selected date to match", () => {
    expect(
      isSessionSelectionActive({
        currentPathname: "/teacher/dashboard/session-2",
        currentSearch: "?date=2026-07-04",
        sessionId: "session-2",
        selectedDate: "2026-07-03",
      }),
    ).toBe(false);

    expect(
      isSessionSelectionActive({
        currentPathname: "/teacher/dashboard/session-2",
        currentSearch: "?date=2026-07-03",
        sessionId: "session-2",
        selectedDate: "2026-07-03",
      }),
    ).toBe(true);
  });
});
