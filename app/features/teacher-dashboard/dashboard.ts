import type { Database } from "~/types/database.types";
import type { LectureScheduleEntry } from "~/utils/schedules";

export type DashboardLecture = {
  id?: string;
  name: string;
  module?: string;
  period: number;
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

type SchedulableLecture = {
  id: string;
  name: string | null;
  module: string | null;
  schedule: LectureScheduleEntry[] | null;
};

export function buildTodaySchedule({
  lectures,
  dayName,
  startPeriod,
  endPeriod,
}: {
  lectures: SchedulableLecture[];
  dayName: string;
  startPeriod: number;
  endPeriod: number;
}) {
  const schedule: DashboardLecture[] = [];

  for (const lecture of lectures) {
    for (const dayPeriod of lecture.schedule ?? []) {
      if (dayPeriod.day !== dayName) continue;

      schedule.push({
        id: lecture.id,
        name: lecture.name ?? "-",
        module: lecture.module ?? undefined,
        period: dayPeriod.period,
      });
    }
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
  currentPeriod,
  selectedLectureId,
}: {
  schedule: DashboardLecture[];
  currentPeriod?: number;
  selectedLectureId?: string;
}) {
  if (selectedLectureId) {
    return schedule.find((lecture) => lecture.id === selectedLectureId);
  }

  if (currentPeriod === undefined) {
    return undefined;
  }

  return schedule.find(
    (lecture) => lecture.id !== undefined && lecture.period === currentPeriod,
  );
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
  hasExplicitSelection: boolean;
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
