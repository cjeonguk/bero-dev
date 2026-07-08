import { createHash, timingSafeEqual } from "node:crypto";
import { PostgrestError } from "@supabase/supabase-js";
import { DateTime } from "luxon";
import type { Route } from "./+types/api";
import { createServiceRoleClient } from "~/lib/supabase/server";
import { getCurrentPeriod, type PeriodScheduleEntry } from "~/utils/schedules";

interface Body {
  clientId: string;
  deviceID: string;
  rssi: number;
  deviceName: string;
  timestamp: string;
  classroom?: string;
}

function hashApiToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function matchesApiToken(token: string | null, tokenHash: string) {
  if (!token) {
    return false;
  }

  const providedHash = Buffer.from(hashApiToken(token), "utf8");
  const storedHash = Buffer.from(tokenHash, "utf8");

  return (
    providedHash.length === storedHash.length &&
    timingSafeEqual(providedHash, storedHash)
  );
}

function getDeviceApiToken(request: Request) {
  const authorization = request.headers.get("Authorization");

  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice(7);
  }

  return request.headers.get("x-device-api-token");
}

export async function action({ request }: Route.ActionArgs) {
  const token = getDeviceApiToken(request);

  if (!token) {
    return Response.json(
      {
        success: false,
        studentName: "",
        error: "Unauthorized",
      },
      { status: 401 },
    );
  }

  const body = (await request.json()) as Body;

  if (!body.clientId || !body.deviceID) {
    return Response.json(
      { success: false, studentName: "", error: "Invalid request" },
      { status: 400 },
    );
  }

  const supabase = createServiceRoleClient();
  try {
    const { data: attendanceClient, error: attendanceClientError } =
      await supabase
        .from("attendance_clients")
        .select(
          "id, school_id, token_hash, active, default_classroom_id, owner_teacher_id",
        )
        .eq("id", body.clientId)
        .maybeSingle();

    if (attendanceClientError || !attendanceClient) {
      return Response.json(
        { success: false, studentName: "", error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!matchesApiToken(token, attendanceClient.token_hash)) {
      return Response.json(
        { success: false, studentName: "", error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!attendanceClient.active) {
      return Response.json(
        { success: false, studentName: "", error: "Client is inactive" },
        { status: 403 },
      );
    }

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
      .eq("school_id", attendanceClient.school_id)
      .eq("device_id", body.deviceID)
      .maybeSingle();

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

    const { data: enrollments, error: enrollmentError } = await supabase
      .from("enrollments")
      .select("lecture_id")
      .match({
        student_id: studentInfo.id,
        semester_id: studentInfo.school.semester.id,
      });

    if (enrollmentError) throw enrollmentError;

    const enrolledLectureIds = (enrollments ?? [])
      .map((enrollment) => enrollment.lecture_id)
      .filter((lectureId): lectureId is string => Boolean(lectureId));

    const { data: currentSessions, error: currentSessionsError } =
      await supabase
        .from("lecture_sessions")
        .select("id, lecture_id, classroom_id, teacher_id")
        .eq("school_id", attendanceClient.school_id)
        .eq("session_date", todayStr)
        .eq("period", currentPeriod);

    if (currentSessionsError) throw currentSessionsError;

    const currentSessionIds = (currentSessions ?? [])
      .map((session) => session.id)
      .filter((sessionId): sessionId is string => Boolean(sessionId));

    const {
      data: currentSessionAttendances,
      error: currentSessionAttendancesError,
    } =
      currentSessionIds.length > 0
        ? await supabase
            .from("attendances")
            .select("lecture_session_id")
            .eq("student_id", studentInfo.id)
            .in("lecture_session_id", currentSessionIds)
        : { data: [], error: null };

    if (currentSessionAttendancesError) throw currentSessionAttendancesError;

    const enrolledSessionIds = (currentSessionAttendances ?? [])
      .map((attendance) => attendance.lecture_session_id)
      .filter((sessionId): sessionId is string => Boolean(sessionId));

    const currentSessionsForClient = (currentSessions ?? []).filter(
      (session) => {
        const isEligibleBySession = enrolledSessionIds.includes(session.id);
        const isEligibleByLecture = session.lecture_id
          ? enrolledLectureIds.includes(session.lecture_id)
          : false;
        const isTeacherClient = Boolean(attendanceClient.owner_teacher_id);
        const isClassroomClient = Boolean(
          attendanceClient.default_classroom_id,
        );

        const isEligible = session.lecture_id
          ? isEligibleByLecture
          : isEligibleBySession;

        if (!isEligible) {
          return false;
        }

        if (isTeacherClient) {
          return session.teacher_id === attendanceClient.owner_teacher_id;
        }

        if (isClassroomClient) {
          return session.classroom_id === attendanceClient.default_classroom_id;
        }

        return false;
      },
    );

    if (currentSessionsForClient.length !== 1) {
      return { success: false, studentName: studentInfo.name };
    }

    const [currentSession] = currentSessionsForClient;

    if (!currentSession?.id || !currentSession.classroom_id) {
      return { success: false, studentName: studentInfo.name };
    }

    const [{ error: updateError }, { error: attendanceClientUpdateError }] =
      await Promise.all([
        supabase
          .from("students")
          .update({ last_detected_place: currentSession.classroom_id })
          .match({ id: studentInfo.id }),
        supabase
          .from("attendance_clients")
          .update({ last_seen_at: new Date().toISOString() })
          .match({ id: attendanceClient.id }),
      ]);

    if (updateError) throw updateError;
    if (attendanceClientUpdateError) throw attendanceClientUpdateError;

    const { error: attendanceError } = await supabase
      .from("attendances")
      .upsert(
        {
          student_id: studentInfo.id,
          lecture_session_id: currentSession.id,
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
