import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~/types/database.types";

type DashboardSupabaseClient = SupabaseClient<Database>;

export type DashboardAttendanceActionResult = {
  ok: boolean;
  message: string;
  intent: "update-attendances";
};

type AttendanceStatus = Database["public"]["Enums"]["attendance_status"];

const attendanceStatuses: AttendanceStatus[] = [
  "present",
  "absent",
  "late",
  "excused",
  "sick leave",
];

function isAttendanceStatus(value: string): value is AttendanceStatus {
  return attendanceStatuses.includes(value as AttendanceStatus);
}

async function getDashboardTeacherActor({
  supabase,
  userId,
}: {
  supabase: DashboardSupabaseClient;
  userId: string;
}) {
  const { data: teacher, error } = await supabase
    .from("teachers")
    .select("school_id, id")
    .eq("user_id", userId)
    .single();

  if (error) {
    throw new Error("account is not a teacher");
  }

  if (!teacher?.school_id) {
    throw new Error("teacher is missing school");
  }

  return teacher;
}

function parseAttendanceUpdates(formData: FormData) {
  const updates: Array<{ studentId: string; status: AttendanceStatus }> = [];
  let hasAttendanceField = false;

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("attendance:") || typeof value !== "string") {
      continue;
    }

    hasAttendanceField = true;

    const studentId = key.replace("attendance:", "").trim();
    const status = value.trim();

    if (!studentId || !isAttendanceStatus(status)) {
      throw new Error("출석 상태를 다시 확인해 주세요.");
    }

    updates.push({ studentId, status });
  }

  if (!hasAttendanceField) {
    throw new Error("변경할 출석 정보가 없습니다.");
  }

  return updates;
}

export async function handleTeacherDashboardAction({
  request,
  supabase,
  userId,
  sessionId,
}: {
  request: Request;
  supabase: DashboardSupabaseClient;
  userId: string;
  sessionId?: string;
}): Promise<DashboardAttendanceActionResult> {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent !== "update-attendances") {
    throw new Error("unsupported intent");
  }

  if (!sessionId) {
    throw new Error("session is required");
  }

  const teacher = await getDashboardTeacherActor({ supabase, userId });
  const { data: lectureSession, error: lectureSessionError } = await supabase
    .from("lecture_sessions")
    .select("id, lecture_id, teacher_id, school_id, kind")
    .eq("id", sessionId)
    .maybeSingle();

  if (lectureSessionError) {
    throw lectureSessionError;
  }

  if (
    !lectureSession?.id ||
    lectureSession.teacher_id !== teacher.id ||
    lectureSession.school_id !== teacher.school_id
  ) {
    throw new Error("session not found");
  }

  const updates = parseAttendanceUpdates(formData);

  const { data: sessionAttendances, error: sessionAttendancesError } =
    await supabase
      .from("attendances")
      .select("student_id")
      .eq("lecture_session_id", sessionId);

  if (sessionAttendancesError) {
    throw sessionAttendancesError;
  }

  const allowedStudentIds = new Set(
    (sessionAttendances ?? [])
      .map((attendance) => attendance.student_id)
      .filter((studentId): studentId is string => Boolean(studentId)),
  );

  if (updates.some((update) => !allowedStudentIds.has(update.studentId))) {
    throw new Error("세션에 없는 학생의 출석은 수정할 수 없습니다.");
  }

  await supabase.from("attendances").upsert(
    updates.map((update) => ({
      student_id: update.studentId,
      lecture_session_id: sessionId,
      status: update.status,
    })),
    { onConflict: "student_id,lecture_session_id" },
  );

  return {
    ok: true,
    message: `${updates.length}명의 출석 상태를 저장했습니다.`,
    intent,
  };
}
