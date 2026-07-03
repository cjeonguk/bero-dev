import { describe, expect, it } from "vitest";

import { shouldRevalidateTeacherDashboardShell } from "~/routes/teacher.dashboard";
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

  it("skips shell revalidation when only the lecture path segment changes", () => {
    expect(
      shouldRevalidateTeacherDashboardShell({
        currentUrl: new URL(
          "https://example.com/teacher/dashboard/lecture-1?date=2026-07-03&period=3",
        ),
        nextUrl: new URL(
          "https://example.com/teacher/dashboard/lecture-2?date=2026-07-03&period=4",
        ),
        formMethod: undefined,
        actionResult: undefined,
        defaultShouldRevalidate: true,
      }),
    ).toBe(false);
  });

  it("revalidates the shell when the selected date changes", () => {
    expect(
      shouldRevalidateTeacherDashboardShell({
        currentUrl: new URL(
          "https://example.com/teacher/dashboard/lecture-1?date=2026-07-03&period=3",
        ),
        nextUrl: new URL(
          "https://example.com/teacher/dashboard/lecture-2?date=2026-07-04&period=4",
        ),
        formMethod: undefined,
        actionResult: undefined,
        defaultShouldRevalidate: true,
      }),
    ).toBe(true);
  });
});
