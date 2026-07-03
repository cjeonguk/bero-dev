import { describe, expect, it } from "vitest";

import { getTeacherDashboardIndexRedirectHref } from "~/routes/teacher.dashboard._index";

describe("teacher dashboard index route", () => {
  it("builds a redirect href to the first scheduled lecture", () => {
    expect(
      getTeacherDashboardIndexRedirectHref(
        [
          { period: 1, name: "-" },
          { id: "lecture-2", name: "Biology", period: 4 },
          { id: "lecture-3", name: "Math", period: 5 },
        ],
        "2026-07-03",
      ),
    ).toBe("/teacher/dashboard/lecture-2?date=2026-07-03&period=4");
  });

  it("does not build a redirect href when there is no scheduled lecture", () => {
    expect(
      getTeacherDashboardIndexRedirectHref(
        [
          { period: 1, name: "-" },
          { period: 2, name: "-" },
        ],
        "2026-07-03",
      ),
    ).toBeUndefined();
  });
});
