import { describe, expect, it } from "vitest";

import {
  normalizeLectureHolidayEntries,
  normalizeLectureScheduleEntries,
  toRequiredString,
} from "./settings";

describe("toRequiredString", () => {
  it("returns a Korean message for known required fields", () => {
    expect(() => toRequiredString("", "name")).toThrow("이름을 입력해 주세요.");
    expect(() => toRequiredString("", "classroomId")).toThrow(
      "교실을 선택해 주세요.",
    );
    expect(() => toRequiredString("", "email")).toThrow(
      "이메일을 입력해 주세요.",
    );
  });

  it("falls back to a generic Korean message for unknown fields", () => {
    expect(() => toRequiredString("", "unknownField")).toThrow(
      "필수 항목을 입력해 주세요.",
    );
  });
});

describe("normalizeLectureScheduleEntries", () => {
  it("keeps valid entries, removes duplicates, and sorts them", () => {
    expect(
      normalizeLectureScheduleEntries([
        { day: "Friday", period: 4 },
        { day: "Monday", period: 3 },
        { day: "Friday", period: 4 },
        { day: "Tuesday", period: "2" },
      ]),
    ).toEqual([
      { day: "Monday", period: 3 },
      { day: "Tuesday", period: 2 },
      { day: "Friday", period: 4 },
    ]);
  });

  it("drops malformed schedule entries", () => {
    expect(
      normalizeLectureScheduleEntries([
        { day: "Monday", period: 3 },
        { day: "Funday", period: 2 },
        { day: "Tuesday", period: 0 },
        { day: "Wednesday" },
        "invalid",
      ] as never),
    ).toEqual([{ day: "Monday", period: 3 }]);
  });
});

describe("normalizeLectureHolidayEntries", () => {
  it("keeps valid entries, removes duplicates, and sorts them", () => {
    expect(
      normalizeLectureHolidayEntries([
        { date: "2026-07-11", period: 3 },
        { date: "2026-07-10", period: 2 },
        { date: "2026-07-10", period: "2" },
        { date: "2026-07-10", period: 1 },
      ]),
    ).toEqual([
      { date: "2026-07-10", period: 1 },
      { date: "2026-07-10", period: 2 },
      { date: "2026-07-11", period: 3 },
    ]);
  });

  it("drops malformed holiday entries", () => {
    expect(
      normalizeLectureHolidayEntries([
        { date: "2026-07-10", period: 2 },
        { date: "07-10-2026", period: 2 },
        { date: "2026-07-11", period: -1 },
        { period: 3 },
        123,
      ] as never),
    ).toEqual([{ date: "2026-07-10", period: 2 }]);
  });
});
