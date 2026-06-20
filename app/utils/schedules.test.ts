import { describe, expect, it } from "vitest";

import { getCurrentPeriod } from "./schedules";

describe("schedule helpers", () => {
  describe("getCurrentPeriod", () => {
    it("returns the period matching the current minute", () => {
      expect(
        getCurrentPeriod(
          [
            { period: 1, start_time: "09:00:00+09", end_time: "09:50:00+09" },
            { period: 2, start_time: "10:00:00+09", end_time: "10:50:00+09" },
          ],
          605,
        ),
      ).toBe(2);
    });

    it("returns undefined when no period matches", () => {
      expect(
        getCurrentPeriod(
          [{ period: 1, start_time: "09:00:00+09", end_time: "09:50:00+09" }],
          530,
        ),
      ).toBeUndefined();
    });
  });
});
