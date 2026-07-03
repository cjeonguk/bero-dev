import { describe, expect, it } from "vitest";

import {
  getDateNavigationHref,
  isLectureSelectionActive,
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

  it("treats the matching lecture path and period as active without loader state", () => {
    expect(
      isLectureSelectionActive({
        currentPathname: "/teacher/dashboard/lecture-2",
        currentSearch: "?date=2026-07-03&period=4",
        lectureId: "lecture-2",
        period: 4,
        selectedDate: "2026-07-03",
      }),
    ).toBe(true);

    expect(
      isLectureSelectionActive({
        currentPathname: "/teacher/dashboard/lecture-1",
        currentSearch: "?date=2026-07-03&period=4",
        lectureId: "lecture-2",
        period: 4,
        selectedDate: "2026-07-03",
      }),
    ).toBe(false);
  });

  it("distinguishes consecutive periods of the same lecture", () => {
    expect(
      isLectureSelectionActive({
        currentPathname: "/teacher/dashboard/lecture-2",
        currentSearch: "?date=2026-07-03&period=3",
        lectureId: "lecture-2",
        period: 4,
        selectedDate: "2026-07-03",
      }),
    ).toBe(false);

    expect(
      isLectureSelectionActive({
        currentPathname: "/teacher/dashboard/lecture-2",
        currentSearch: "?date=2026-07-03&period=4",
        lectureId: "lecture-2",
        period: 4,
        selectedDate: "2026-07-03",
      }),
    ).toBe(true);
  });
});
