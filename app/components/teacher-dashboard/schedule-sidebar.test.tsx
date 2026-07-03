import { describe, expect, it } from "vitest";

import { getLectureSelectionHref } from "./schedule-sidebar";

describe("ScheduleSidebar helpers", () => {
  it("builds a distinct href for each consecutive period of the same lecture", () => {
    expect(getLectureSelectionHref("lecture-2", 3)).toBe(
      "/teacher/dashboard/lecture-2?period=3",
    );
    expect(getLectureSelectionHref("lecture-2", 4)).toBe(
      "/teacher/dashboard/lecture-2?period=4",
    );
  });
});
