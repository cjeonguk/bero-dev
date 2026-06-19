import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~/types/database.types";
import type {
  AbsentAttendanceRow,
  AttendanceRepository,
} from "~/services/attendance.server";

type EnrollmentRow = {
  student?: {
    id: string | null;
  } | null;
};

type AttendanceRow = {
  student_id: string | null;
};

export function createAttendanceRepository(
  supabase: SupabaseClient<Database>,
): AttendanceRepository {
  return {
    async listEnrollmentStudentIds(lectureId) {
      const { data, error } = await supabase
        .from("enrollments")
        .select(
          `
          student:student_id (
            id
          )`,
        )
        .eq("lecture_id", lectureId);

      if (error) {
        throw new Error("error in retrieving enrollments");
      }

      return (data ?? [])
        .map((enrollment: EnrollmentRow) => enrollment.student?.id)
        .filter((studentId: string | null | undefined): studentId is string =>
          Boolean(studentId),
        );
    },

    async listAttendanceStudentIds({ lectureId, attendanceDate, period }) {
      const { data, error } = await supabase
        .from("attendances")
        .select("student_id")
        .eq("lecture_id", lectureId)
        .eq("attendance_date", attendanceDate)
        .eq("period", period);

      if (error) {
        throw new Error("error in retrieving attendances");
      }

      return (data ?? [])
        .map((attendance: AttendanceRow) => attendance.student_id)
        .filter((studentId: string | null): studentId is string =>
          Boolean(studentId),
        );
    },

    async createAbsentAttendances(rows: AbsentAttendanceRow[]) {
      const { error } = await supabase.from("attendances").insert(rows);

      if (error) {
        throw new Error("error in creating attendances");
      }
    },
  };
}
