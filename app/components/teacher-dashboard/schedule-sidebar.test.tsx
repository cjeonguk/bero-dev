import { describe, expect, it } from "vitest";

import {
  getDateNavigationHref,
  getLectureSelectionHref,
} from "./schedule-sidebar.helpers";

describe("ScheduleSidebar helpers", () => {
  it("builds a distinct href for each consecutive period of the same lecture", () => {
    expect(getLectureSelectionHref("lecture-2", 3, "2026-07-03")).toBe(
      "/teacher/dashboard/lecture-2?date=2026-07-03&period=3",
    );
    expect(getLectureSelectionHref("lecture-2", 4, "2026-07-03")).toBe(
      "/teacher/dashboard/lecture-2?date=2026-07-03&period=4",
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
});
