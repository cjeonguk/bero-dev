import { describe, expect, it } from "vitest";

import {
  buildTodaySchedule,
  getCurrentPeriod,
  mergeStudentsWithAttendances,
  resolveDashboardViewState,
  selectLecture,
} from "./dashboard.server";

describe("teacher dashboard server helpers", () => {
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

  describe("buildTodaySchedule", () => {
    it("returns the day's lectures and fills empty periods", () => {
      expect(
        buildTodaySchedule({
          lectures: [
            {
              id: "lecture-1",
              name: "Algebra",
              module: "Math",
              schedule: [{ day: "Thursday", period: 2 }],
            },
            {
              id: "lecture-2",
              name: "Biology",
              module: null,
              schedule: [{ day: "Thursday", period: 4 }],
            },
            {
              id: "lecture-3",
              name: "Ignore me",
              module: "Other",
              schedule: [{ day: "Friday", period: 3 }],
            },
          ],
          dayName: "Thursday",
          startPeriod: 1,
          endPeriod: 4,
        }),
      ).toEqual([
        { period: 1, name: "-" },
        { id: "lecture-1", name: "Algebra", module: "Math", period: 2 },
        { period: 3, name: "-" },
        { id: "lecture-2", name: "Biology", module: undefined, period: 4 },
      ]);
    });
  });

  describe("selectLecture", () => {
    const schedule = [
      { id: "lecture-1", name: "Algebra", period: 2 },
      { id: "lecture-2", name: "Biology", period: 4 },
    ];

    it("prefers an explicitly selected lecture id", () => {
      expect(
        selectLecture({
          schedule,
          currentPeriod: 2,
          selectedLectureId: "lecture-2",
        }),
      ).toEqual(schedule[1]);
    });

    it("falls back to the current period when no lecture id is selected", () => {
      expect(
        selectLecture({
          schedule,
          currentPeriod: 2,
        }),
      ).toEqual(schedule[0]);
    });

    it("returns undefined when nothing can be selected", () => {
      expect(
        selectLecture({
          schedule,
          currentPeriod: 3,
        }),
      ).toBeUndefined();
    });
  });

  describe("mergeStudentsWithAttendances", () => {
    it("defaults students to absent and applies recorded statuses", () => {
      expect(
        mergeStudentsWithAttendances({
          students: [
            { id: "student-1", name: "Kim", num: "1" },
            { id: "student-2", name: "Lee", num: "2" },
          ],
          attendances: [{ student_id: "student-2", status: "present" }],
        }),
      ).toEqual([
        { id: "student-1", name: "Kim", num: "1", attendance: "absent" },
        { id: "student-2", name: "Lee", num: "2", attendance: "present" },
      ]);
    });
  });

  describe("resolveDashboardViewState", () => {
    it("returns no-semester when there is no active semester", () => {
      expect(
        resolveDashboardViewState({
          hasSemester: false,
          hasCurrentLecture: false,
          isDayFinished: false,
          hasExplicitSelection: false,
        }),
      ).toBe("no-semester");
    });

    it("returns day-finished when today's classes are over and nothing is selected", () => {
      expect(
        resolveDashboardViewState({
          hasSemester: true,
          hasCurrentLecture: false,
          isDayFinished: true,
          hasExplicitSelection: false,
        }),
      ).toBe("day-finished");
    });

    it("returns no-selection when there is no selected lecture", () => {
      expect(
        resolveDashboardViewState({
          hasSemester: true,
          hasCurrentLecture: false,
          isDayFinished: false,
          hasExplicitSelection: false,
        }),
      ).toBe("no-selection");
    });

    it("returns active-lecture when a lecture is available", () => {
      expect(
        resolveDashboardViewState({
          hasSemester: true,
          hasCurrentLecture: true,
          isDayFinished: false,
          hasExplicitSelection: false,
        }),
      ).toBe("active-lecture");
    });
  });
});
