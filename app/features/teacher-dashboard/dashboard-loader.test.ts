import { describe, expect, it } from "vitest";

import {
  getSelectedDateFromRequest,
  getSelectedPeriodFromRequest,
} from "./dashboard-loader";

describe("teacher dashboard loader helpers", () => {
  it("reads the selected period from the dashboard URL", () => {
    const request = new Request(
      "https://example.com/teacher/dashboard/lecture-2?date=2026-07-03&period=4",
    );

    expect(getSelectedPeriodFromRequest(request)).toBe(4);
  });

  it("reads the selected date from the dashboard URL", () => {
    const request = new Request(
      "https://example.com/teacher/dashboard/lecture-2?date=2026-07-03&period=4",
    );

    expect(getSelectedDateFromRequest(request)).toBe("2026-07-03");
  });

  it("ignores an invalid selected date", () => {
    const request = new Request(
      "https://example.com/teacher/dashboard/lecture-2?date=not-a-date&period=4",
    );

    expect(getSelectedDateFromRequest(request)).toBeUndefined();
  });
});
