import { describe, expect, it, vi } from "vitest";

import { ensureLectureAttendances } from "./attendance.server";

describe("attendance service", () => {
  it("creates absent rows for students without an attendance row", async () => {
    const repository = {
      listEnrollmentStudentIds: vi
        .fn()
        .mockResolvedValue(["student-1", "student-2"]),
      listAttendanceStudentIds: vi.fn().mockResolvedValue(["student-1"]),
      createAbsentAttendances: vi.fn().mockResolvedValue(undefined),
    };

    await ensureLectureAttendances({
      repository,
      lectureId: "lecture-1",
      attendanceDate: "2026-06-18",
      period: 2,
    });

    expect(repository.createAbsentAttendances).toHaveBeenCalledWith([
      {
        student_id: "student-2",
        lecture_id: "lecture-1",
        attendance_date: "2026-06-18",
        status: "absent",
        period: 2,
      },
    ]);
  });

  it("does not insert when attendance rows already exist for every student", async () => {
    const repository = {
      listEnrollmentStudentIds: vi
        .fn()
        .mockResolvedValue(["student-1", "student-2"]),
      listAttendanceStudentIds: vi
        .fn()
        .mockResolvedValue(["student-1", "student-2"]),
      createAbsentAttendances: vi.fn().mockResolvedValue(undefined),
    };

    await ensureLectureAttendances({
      repository,
      lectureId: "lecture-1",
      attendanceDate: "2026-06-18",
      period: 2,
    });

    expect(repository.createAbsentAttendances).not.toHaveBeenCalled();
  });
});
