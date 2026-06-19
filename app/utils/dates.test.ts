import { describe, expect, it } from "vitest";

import { getDayName, localYYYYMMDD, timetzToMinutes } from "./dates";

describe("dates utilities", () => {
  it("returns the weekday name for a date", () => {
    expect(getDayName(new Date("2026-06-18T12:00:00Z"))).toBe("Thursday");
  });

  it("formats a local date as YYYY-MM-DD", () => {
    expect(localYYYYMMDD(new Date(2026, 5, 18))).toBe("2026-06-18");
  });

  it("converts timetz strings to minutes", () => {
    expect(timetzToMinutes("09:45:00+09")).toBe(585);
  });
});
