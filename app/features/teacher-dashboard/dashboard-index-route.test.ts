import { describe, expect, it } from "vitest";

import { getTeacherDashboardIndexRedirectHref } from "~/routes/teacher.dashboard._index";

describe("teacher dashboard index route", () => {
  it("builds a redirect href when a current lecture is available", () => {
    expect(
      getTeacherDashboardIndexRedirectHref({
        id: "lecture-2",
        name: "Biology",
        period: 4,
      }),
    ).toBe("/teacher/dashboard/lecture-2?period=4");
  });

  it("does not build a redirect href when there is no current lecture", () => {
    expect(getTeacherDashboardIndexRedirectHref(undefined)).toBeUndefined();
  });
});
