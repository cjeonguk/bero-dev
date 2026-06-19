export type AbsentAttendanceRow = {
  student_id: string;
  lecture_id: string;
  attendance_date: string;
  status: "absent";
  period: number;
};

export type AttendanceRepository = {
  listEnrollmentStudentIds: (lectureId: string) => Promise<string[]>;
  listAttendanceStudentIds: (params: {
    lectureId: string;
    attendanceDate: string;
    period: number;
  }) => Promise<string[]>;
  createAbsentAttendances: (rows: AbsentAttendanceRow[]) => Promise<void>;
};

export async function ensureLectureAttendances({
  repository,
  lectureId,
  attendanceDate,
  period,
}: {
  repository: AttendanceRepository;
  lectureId: string;
  attendanceDate: string;
  period: number;
}) {
  const studentIds = await repository.listEnrollmentStudentIds(lectureId);

  if (studentIds.length === 0) {
    return;
  }

  const existingStudentIds = new Set(
    await repository.listAttendanceStudentIds({
      lectureId,
      attendanceDate,
      period,
    }),
  );

  const missingAttendanceRows = studentIds
    .filter((studentId) => !existingStudentIds.has(studentId))
    .map((student_id) => ({
      student_id,
      lecture_id: lectureId,
      attendance_date: attendanceDate,
      status: "absent" as const,
      period,
    }));

  if (missingAttendanceRows.length === 0) {
    return;
  }

  await repository.createAbsentAttendances(missingAttendanceRows);
}
