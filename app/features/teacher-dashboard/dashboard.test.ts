import { describe, expect, it } from "vitest";

import {
  buildTodaySchedule,
  mergeStudentsWithAttendances,
  resolveDashboardViewState,
  selectLecture,
} from "./dashboard";

describe("teacher dashboard helpers", () => {
  describe("buildTodaySchedule", () => {
    it("returns the day's sessions and fills empty periods", () => {
      expect(
        buildTodaySchedule({
          sessions: [
            {
              sessionId: "session-1",
              lectureId: "lecture-1",
              name: "Algebra",
              module: "Math",
              period: 2,
              kind: "regular",
            },
            {
              sessionId: "session-2",
              lectureId: null,
              name: "Biology",
              module: null,
              period: 4,
              kind: "special",
            },
          ],
          startPeriod: 1,
          endPeriod: 4,
        }),
      ).toEqual([
        { period: 1, name: "-" },
        {
          sessionId: "session-1",
          lectureId: "lecture-1",
          name: "Algebra",
          module: "Math",
          period: 2,
          kind: "regular",
        },
        { period: 3, name: "-" },
        {
          sessionId: "session-2",
          lectureId: null,
          name: "Biology",
          module: undefined,
          period: 4,
          kind: "special",
        },
      ]);
    });
  });

  describe("selectLecture", () => {
    const schedule = [
      {
        sessionId: "session-1",
        lectureId: "lecture-1",
        name: "Algebra",
        period: 2,
      },
      {
        sessionId: "session-2",
        lectureId: "lecture-2",
        name: "Biology",
        period: 3,
      },
      {
        sessionId: "session-3",
        lectureId: "lecture-2",
        name: "Biology",
        period: 4,
      },
    ];

    it("selects the explicitly chosen session", () => {
      expect(
        selectLecture({
          schedule,
          selectedSessionId: "session-3",
        }),
      ).toEqual(schedule[2]);
    });

    it("returns the selected session even when the lecture repeats", () => {
      expect(
        selectLecture({
          schedule,
          selectedSessionId: "session-2",
        }),
      ).toEqual(schedule[1]);
    });

    it("returns undefined when nothing can be selected", () => {
      expect(
        selectLecture({
          schedule,
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
        }),
      ).toBe("no-semester");
    });

    it("returns day-finished when today's classes are over and nothing is selected", () => {
      expect(
        resolveDashboardViewState({
          hasSemester: true,
          hasCurrentLecture: false,
          isDayFinished: true,
        }),
      ).toBe("day-finished");
    });

    it("returns no-selection when there is no selected lecture", () => {
      expect(
        resolveDashboardViewState({
          hasSemester: true,
          hasCurrentLecture: false,
          isDayFinished: false,
        }),
      ).toBe("no-selection");
    });

    it("returns active-lecture when a lecture is available", () => {
      expect(
        resolveDashboardViewState({
          hasSemester: true,
          hasCurrentLecture: true,
          isDayFinished: false,
        }),
      ).toBe("active-lecture");
    });
  });
});
