import type { Database } from "~/types/database.types";

export type DashboardLecture = {
  sessionId?: string;
  lectureId?: string | null;
  name: string;
  module?: string;
  period: number;
  kind?: Database["public"]["Enums"]["lecture_session_kind"];
};

export type DashboardStudent = {
  id: string;
  name: string;
  num: string;
};

export type DashboardStudentAttendance = DashboardStudent & {
  attendance: Database["public"]["Enums"]["attendance_status"];
};

export type DashboardViewState =
  | "active-lecture"
  | "day-finished"
  | "no-semester"
  | "no-selection";

type SchedulableSession = {
  sessionId: string;
  lectureId: string | null;
  name: string | null;
  module: string | null;
  period: number;
  kind: Database["public"]["Enums"]["lecture_session_kind"];
};

export function buildTodaySchedule({
  sessions,
  startPeriod,
  endPeriod,
}: {
  sessions: SchedulableSession[];
  startPeriod: number;
  endPeriod: number;
}) {
  const schedule: DashboardLecture[] = [];

  for (const session of sessions) {
    schedule.push({
      sessionId: session.sessionId,
      lectureId: session.lectureId,
      name: session.name ?? "-",
      module: session.module ?? undefined,
      period: session.period,
      kind: session.kind,
    });
  }

  for (let period = startPeriod; period <= endPeriod; period++) {
    if (!schedule.some((lecture) => lecture.period === period)) {
      schedule.push({ period, name: "-" });
    }
  }

  return schedule.sort((left, right) => left.period - right.period);
}

export function selectLecture({
  schedule,
  selectedSessionId,
}: {
  schedule: DashboardLecture[];
  selectedSessionId?: string;
}) {
  if (!selectedSessionId) {
    return undefined;
  }

  return schedule.find((lecture) => lecture.sessionId === selectedSessionId);
}

export function mergeStudentsWithAttendances({
  students,
  attendances,
}: {
  students: DashboardStudent[];
  attendances: Array<{
    student_id: string | null;
    status: Database["public"]["Enums"]["attendance_status"] | null;
  }>;
}) {
  const attendanceByStudentId = new Map(
    attendances
      .filter(
        (
          attendance,
        ): attendance is {
          student_id: string;
          status: Database["public"]["Enums"]["attendance_status"];
        } => Boolean(attendance.student_id && attendance.status),
      )
      .map((attendance) => [attendance.student_id, attendance.status]),
  );

  return students.map((student) => ({
    ...student,
    attendance: attendanceByStudentId.get(student.id) ?? "absent",
  }));
}

export function resolveDashboardViewState({
  hasSemester,
  hasCurrentLecture,
  isDayFinished,
}: {
  hasSemester: boolean;
  hasCurrentLecture: boolean;
  isDayFinished: boolean;
}): DashboardViewState {
  if (!hasSemester) {
    return "no-semester";
  }

  if (hasCurrentLecture) {
    return "active-lecture";
  }

  if (isDayFinished) {
    return "day-finished";
  }

  return "no-selection";
}
