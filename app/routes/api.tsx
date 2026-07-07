import { PostgrestError } from "@supabase/supabase-js";
import { DateTime } from "luxon";
import type { Route } from "./+types/api";
import { createServiceRoleClient } from "~/lib/supabase/server";
import { getCurrentPeriod, type PeriodScheduleEntry } from "~/utils/schedules";

interface Body {
  deviceID: string;
  rssi: number;
  deviceName: string;
  timestamp: string;
  classroom: string;
}

function getDeviceApiToken(request: Request) {
  const authorization = request.headers.get("Authorization");

  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice(7);
  }

  return request.headers.get("x-device-api-token");
}

export async function action({ request }: Route.ActionArgs) {
  const configuredToken = process.env.DEVICE_API_TOKEN;

  if (!configuredToken) {
    return Response.json(
      {
        success: false,
        studentName: "",
        error: "Device API is not configured",
      },
      { status: 500 },
    );
  }

  if (getDeviceApiToken(request) !== configuredToken) {
    return Response.json(
      { success: false, studentName: "", error: "Unauthorized" },
      { status: 401 },
    );
  }

  const body = (await request.json()) as Body;

  const supabase = createServiceRoleClient();
  try {
    const { data: studentInfo, error: studentError } = await supabase
      .from("students")
      .select(
        `
        name,
        id,
        school:school_id (
          id,
          semester:current_semester_id (
            id,
            period_schedules
          )
        )
      `,
      )
      .eq("device_id", body.deviceID)
      .single();

    if (studentError) throw studentError;

    if (
      !studentInfo ||
      !studentInfo.name ||
      !studentInfo.id ||
      !studentInfo.school ||
      !studentInfo.school.semester
    )
      return { success: false, studentName: "" };

    const periodSchedules = studentInfo.school.semester
      .period_schedules as unknown as PeriodScheduleEntry[];

    const now = DateTime.now().setZone("Asia/Seoul").setLocale("en-US");
    const todayStr = now.toFormat("yyyy-MM-dd");

    const nowMinutes = now.hour * 60 + now.minute;
    const currentPeriod = getCurrentPeriod(periodSchedules, nowMinutes);

    if (currentPeriod === undefined) {
      return { success: false, studentName: studentInfo.name };
    }

    const [
      { data: enrollments, error: enrollmentError },
      { data: specialSessionEnrollments, error: sessionEnrollmentError },
    ] = await Promise.all([
      supabase.from("enrollments").select("lecture_id").match({
        student_id: studentInfo.id,
        semester_id: studentInfo.school.semester.id,
      }),
      supabase
        .from("lecture_session_enrollments")
        .select("lecture_session_id")
        .eq("student_id", studentInfo.id),
    ]);

    if (enrollmentError) throw enrollmentError;
    if (sessionEnrollmentError) throw sessionEnrollmentError;

    const enrolledLectureIds = (enrollments ?? [])
      .map((enrollment) => enrollment.lecture_id)
      .filter((lectureId): lectureId is string => Boolean(lectureId));
    const enrolledSessionIds = (specialSessionEnrollments ?? [])
      .map((enrollment) => enrollment.lecture_session_id)
      .filter((sessionId): sessionId is string => Boolean(sessionId));

    const { data: currentSessions, error: currentSessionsError } =
      await supabase
        .from("lecture_sessions")
        .select("id, lecture_id, classroom_id, classroom:classroom_id(name)")
        .eq("school_id", studentInfo.school.id)
        .eq("session_date", todayStr)
        .eq("period", currentPeriod);

    if (currentSessionsError) throw currentSessionsError;

    const currentSession = (currentSessions ?? []).find((session) => {
      const isEligible =
        enrolledSessionIds.includes(session.id) ||
        (session.lecture_id
          ? enrolledLectureIds.includes(session.lecture_id)
          : false);

      if (!isEligible) {
        return false;
      }

      return session.classroom?.name === body.classroom;
    });

    if (!currentSession?.id || !currentSession.classroom_id) {
      return { success: false, studentName: studentInfo.name };
    }

    const { error: updateError } = await supabase
      .from("students")
      .update({ last_detected_place: currentSession.classroom_id })
      .match({ id: studentInfo.id });

    if (updateError) throw updateError;

    const { error: attendanceError } = await supabase
      .from("attendances")
      .upsert(
        {
          student_id: studentInfo.id,
          lecture_id: currentSession.lecture_id,
          lecture_session_id: currentSession.id,
          attendance_date: todayStr,
          period: currentPeriod,
          status: "present",
        },
        {
          onConflict: "student_id,lecture_session_id",
        },
      );

    if (attendanceError) throw attendanceError;

    return { success: true, studentName: studentInfo.name };
  } catch (error) {
    if (error instanceof PostgrestError) {
      console.error("API ERROR:", error.message);
    }

    return Response.json(
      { success: false, studentName: "", error: "Attendance update failed" },
      { status: 500 },
    );
  }
}
