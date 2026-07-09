import { DateTime } from "luxon";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~/types/database.types";

type DashboardSupabaseClient = SupabaseClient<Database>;
type DashboardServiceRoleClient = SupabaseClient<Database>;

export type DashboardAttendanceActionResult = {
  ok: boolean;
  message: string;
  intent: "update-attendances";
};

export type DashboardSessionCreationActionResult = {
  ok: boolean;
  message: string;
  intent: "create-manual-session";
  sessionId?: string;
  selectedDate?: string;
};

export type TeacherDashboardActionResult =
  | DashboardAttendanceActionResult
  | DashboardSessionCreationActionResult;

type AttendanceStatus = Database["public"]["Enums"]["attendance_status"];
type ManualSessionKind = Extract<
  Database["public"]["Enums"]["lecture_session_kind"],
  "makeup" | "special"
>;

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

function isManualSessionKind(value: string): value is ManualSessionKind {
  return value === "makeup" || value === "special";
}

function normalizeClassroomName(name: string) {
  return name.trim().toLowerCase();
}

function toOptionalString(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function toRequiredString(value: FormDataEntryValue | null, label: string) {
  const parsed = toOptionalString(value);

  if (parsed) {
    return parsed;
  }

  const messages: Record<string, string> = {
    name: "수업명을 입력해 주세요.",
    classroomName: "교실 이름을 입력해 주세요.",
    sourceLectureId: "원본 수업을 선택해 주세요.",
    selectedDate: "날짜 정보를 다시 확인해 주세요.",
  };

  throw new Error(messages[label] ?? "필수 항목을 입력해 주세요.");
}

function toPositiveInteger(value: FormDataEntryValue | null, label: string) {
  const parsed = toOptionalString(value);
  const numeric = parsed ? Number(parsed) : Number.NaN;

  if (Number.isInteger(numeric) && numeric > 0) {
    return numeric;
  }

  const messages: Record<string, string> = {
    period: "교시 정보를 다시 확인해 주세요.",
  };

  throw new Error(messages[label] ?? "숫자 값을 다시 확인해 주세요.");
}

async function getDashboardTeacherActor({
  supabase,
  userId,
}: {
  supabase: DashboardSupabaseClient;
  userId: string;
}): Promise<{ id: string; school_id: string }> {
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

  return {
    id: teacher.id,
    school_id: teacher.school_id,
  };
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

function parseSelectedDate(value: FormDataEntryValue | null) {
  const selectedDate = toRequiredString(value, "selectedDate");
  const parsed = DateTime.fromISO(selectedDate, { zone: "Asia/Seoul" });

  if (!parsed.isValid) {
    throw new Error("날짜 정보를 다시 확인해 주세요.");
  }

  return parsed.toFormat("yyyy-MM-dd");
}

function parseManualSessionInput(formData: FormData) {
  const kind = toOptionalString(formData.get("kind"));

  if (!kind || !isManualSessionKind(kind)) {
    throw new Error("보강 또는 특강을 선택해 주세요.");
  }

  const selectedDate = parseSelectedDate(formData.get("selectedDate"));
  const period = toPositiveInteger(formData.get("period"), "period");
  const name = toRequiredString(formData.get("name"), "name");
  const classroomName = toRequiredString(
    formData.get("classroomName"),
    "classroomName",
  );
  const note = toOptionalString(formData.get("note"));
  const sourceLectureId = toOptionalString(formData.get("sourceLectureId"));
  const studentIds = Array.from(
    new Set(
      formData
        .getAll("studentIds")
        .map((value) => toOptionalString(value))
        .filter((value): value is string => Boolean(value)),
    ),
  );

  if (kind === "makeup" && !sourceLectureId) {
    throw new Error("원본 수업을 선택해 주세요.");
  }

  if (kind === "special" && studentIds.length === 0) {
    throw new Error("특강에 등록할 학생을 한 명 이상 선택해 주세요.");
  }

  return {
    kind,
    selectedDate,
    period,
    name,
    classroomName,
    note,
    sourceLectureId,
    studentIds,
  };
}

async function loadSchoolClassrooms({
  supabase,
  schoolId,
}: {
  supabase: DashboardServiceRoleClient;
  schoolId: string;
}) {
  const { data, error } = await supabase
    .from("classrooms")
    .select("id, name")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).filter(
    (classroom): classroom is { id: string; name: string } =>
      Boolean(classroom.id && classroom.name),
  );
}

async function resolveClassroomId({
  supabase,
  schoolId,
  classroomName,
}: {
  supabase: DashboardServiceRoleClient;
  schoolId: string;
  classroomName: string;
}) {
  const trimmedClassroomName = classroomName.trim();
  const normalizedClassroomName = normalizeClassroomName(trimmedClassroomName);

  const findMatchingClassroom = async () => {
    const classrooms = await loadSchoolClassrooms({ supabase, schoolId });

    return classrooms.find(
      (classroom) =>
        normalizeClassroomName(classroom.name) === normalizedClassroomName,
    );
  };

  const existingClassroom = await findMatchingClassroom();
  if (existingClassroom?.id) {
    return existingClassroom.id;
  }

  throw new Error("입력한 이름과 일치하는 교실이 없습니다.");
}

async function handleAttendanceUpdate({
  formData,
  supabase,
  userId,
  sessionId,
}: {
  formData: FormData;
  supabase: DashboardSupabaseClient;
  userId: string;
  sessionId?: string;
}): Promise<DashboardAttendanceActionResult> {
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
    intent: "update-attendances",
  };
}

async function handleManualSessionCreation({
  formData,
  supabase,
  serviceRoleSupabase,
  userId,
}: {
  formData: FormData;
  supabase: DashboardSupabaseClient;
  serviceRoleSupabase?: DashboardServiceRoleClient;
  userId: string;
}): Promise<DashboardSessionCreationActionResult> {
  if (!serviceRoleSupabase) {
    throw new Error("service role client is required");
  }

  const teacher = await getDashboardTeacherActor({ supabase, userId });
  const input = parseManualSessionInput(formData);
  const { data: semester, error: semesterError } = await supabase
    .from("semester_schedules")
    .select("id")
    .eq("school_id", teacher.school_id)
    .lte("start_date", input.selectedDate)
    .gte("end_date", input.selectedDate)
    .maybeSingle();

  if (semesterError) {
    throw new Error("학기 정보를 불러오지 못했습니다.");
  }

  if (!semester?.id) {
    throw new Error("선택한 날짜에는 진행 중인 학기가 없습니다.");
  }

  const schoolId = teacher.school_id;
  const teacherId = teacher.id;
  const semesterId = semester.id;

  const classroomId = await resolveClassroomId({
    supabase: serviceRoleSupabase,
    schoolId,
    classroomName: input.classroomName,
  });

  let lectureId: string | null = null;
  let module: string | null = null;
  let targetStudentIds = input.studentIds;

  if (input.kind === "makeup") {
    const { data: sourceLecture, error: sourceLectureError } = await supabase
      .from("lectures")
      .select("id, module, semester_id")
      .eq("id", input.sourceLectureId ?? "")
      .eq("teacher_id", teacherId)
      .maybeSingle();

    if (sourceLectureError) {
      throw sourceLectureError;
    }

    if (!sourceLecture?.id || sourceLecture.semester_id !== semesterId) {
      throw new Error("현재 학기의 원본 수업만 보강으로 등록할 수 있습니다.");
    }

    const sourceLectureId = sourceLecture.id;

    const { data: enrollments, error: enrollmentError } = await supabase
      .from("enrollments")
      .select("student_id")
      .eq("lecture_id", sourceLectureId)
      .eq("semester_id", semesterId);

    if (enrollmentError) {
      throw enrollmentError;
    }

    targetStudentIds = Array.from(
      new Set(
        (enrollments ?? [])
          .map((enrollment) => enrollment.student_id)
          .filter((studentId): studentId is string => Boolean(studentId)),
      ),
    );

    if (targetStudentIds.length === 0) {
      throw new Error(
        "원본 수업에 등록된 학생이 없어 보강을 만들 수 없습니다.",
      );
    }

    lectureId = sourceLectureId;
    module = sourceLecture.module ?? null;
  } else {
    const { data: students, error: studentsError } = await supabase
      .from("students")
      .select("id")
      .eq("school_id", schoolId)
      .in("id", targetStudentIds);

    if (studentsError) {
      throw studentsError;
    }

    const availableStudentIds = new Set(
      (students ?? [])
        .map((student) => student.id)
        .filter((studentId): studentId is string => Boolean(studentId)),
    );

    if (
      targetStudentIds.some((studentId) => !availableStudentIds.has(studentId))
    ) {
      throw new Error("특강 학생 정보를 다시 확인해 주세요.");
    }
  }

  const { data: conflictingSessions, error: conflictError } =
    await serviceRoleSupabase
      .from("lecture_sessions")
      .select("id, teacher_id, classroom_id")
      .eq("school_id", schoolId)
      .eq("session_date", input.selectedDate)
      .eq("period", input.period);

  if (conflictError) {
    throw conflictError;
  }

  if (
    (conflictingSessions ?? []).some(
      (session) => session.teacher_id === teacher.id,
    )
  ) {
    throw new Error("해당 날짜와 교시에는 이미 수업이 등록되어 있습니다.");
  }

  if (
    (conflictingSessions ?? []).some(
      (session) => session.classroom_id === classroomId,
    )
  ) {
    throw new Error("선택한 교실은 해당 날짜와 교시에 이미 사용 중입니다.");
  }

  const { data: insertedSession, error: insertSessionError } =
    await serviceRoleSupabase
      .from("lecture_sessions")
      .insert({
        lecture_id: lectureId,
        school_id: schoolId,
        semester_id: semesterId,
        name: input.name,
        module,
        session_date: input.selectedDate,
        period: input.period,
        classroom_id: classroomId,
        teacher_id: teacherId,
        kind: input.kind,
        note: input.note ?? null,
      })
      .select("id")
      .single();

  if (insertSessionError || !insertedSession?.id) {
    throw insertSessionError ?? new Error("세션을 생성하지 못했습니다.");
  }

  const insertedSessionId = insertedSession.id;

  const { error: insertAttendancesError } = await serviceRoleSupabase
    .from("attendances")
    .upsert(
      targetStudentIds.map((studentId) => ({
        student_id: studentId,
        lecture_session_id: insertedSessionId,
        status: "absent" as const,
      })),
      { onConflict: "student_id,lecture_session_id" },
    );

  if (insertAttendancesError) {
    throw insertAttendancesError;
  }

  return {
    ok: true,
    message:
      input.kind === "makeup" ? "보강을 등록했습니다." : "특강을 등록했습니다.",
    intent: "create-manual-session",
    sessionId: insertedSessionId,
    selectedDate: input.selectedDate,
  };
}

export async function handleTeacherDashboardAction({
  request,
  supabase,
  serviceRoleSupabase,
  userId,
  sessionId,
}: {
  request: Request;
  supabase: DashboardSupabaseClient;
  serviceRoleSupabase?: DashboardServiceRoleClient;
  userId: string;
  sessionId?: string;
}): Promise<TeacherDashboardActionResult> {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "update-attendances") {
    return handleAttendanceUpdate({
      formData,
      supabase,
      userId,
      sessionId,
    });
  }

  if (intent === "create-manual-session") {
    return handleManualSessionCreation({
      formData,
      supabase,
      serviceRoleSupabase,
      userId,
    });
  }

  throw new Error("unsupported intent");
}
