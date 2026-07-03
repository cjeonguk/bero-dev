import { describe, expect, it } from "vitest";

import { getSelectedPeriodFromRequest } from "./dashboard-loader";

describe("teacher dashboard loader helpers", () => {
  it("reads the selected period from the dashboard URL", () => {
    const request = new Request(
      "https://example.com/teacher/dashboard/lecture-2?period=4",
    );

    expect(getSelectedPeriodFromRequest(request)).toBe(4);
  });
});
