import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~/types/database.types";
import {
  getTodayInSeoul,
  isStudentStatus,
  parseJsonArrayField,
  parseAttendanceMarkInput,
  toOptionalNumber,
  toOptionalString,
  toRequiredString,
  type TeacherActor,
  type TeacherSettingsActionResult,
} from "./settings";

type TeacherSettingsSupabaseClient = SupabaseClient<Database>;

type TeacherSettingsServiceRoleClient = SupabaseClient<Database>;

async function loadTeacherActor({
  supabase,
  userId,
}: {
  supabase: TeacherSettingsSupabaseClient;
  userId: string;
}) {
  const { data, error } = await supabase
    .from("teachers")
    .select("id, school_id, name, is_admin")
    .eq("user_id", userId)
    .single();

  if (error || !data?.id || !data.school_id) {
    throw new Error("account is not a teacher");
  }

  return {
    id: data.id,
    school_id: data.school_id,
    name: data.name,
    is_admin: data.is_admin,
  } satisfies TeacherActor;
}

function ensureAdmin(actor: TeacherActor) {
  if (!actor.is_admin) {
    throw new Error("admin privileges are required");
  }
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function normalizeClassroomName(name: string) {
  return name.trim().toLowerCase();
}

function isUniqueViolationError(error: unknown): error is { code: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

async function loadSchoolClassrooms({
  supabase,
  schoolId,
}: {
  supabase: TeacherSettingsSupabaseClient;
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
  generateId,
}: {
  supabase: TeacherSettingsSupabaseClient;
  schoolId: string;
  classroomName: string;
  generateId: () => string;
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

  const classroomId = generateId();
  const { error: insertError } = await supabase.from("classrooms").insert({
    id: classroomId,
    school_id: schoolId,
    name: trimmedClassroomName,
  });

  if (!insertError) {
    return classroomId;
  }

  if (!isUniqueViolationError(insertError)) {
    throw insertError;
  }

  const concurrentClassroom = await findMatchingClassroom();
  if (concurrentClassroom?.id) {
    return concurrentClassroom.id;
  }

  throw insertError;
}

async function refreshLectureSessions({
  serviceRoleSupabase,
  lectureId,
  now,
}: {
  serviceRoleSupabase: TeacherSettingsServiceRoleClient;
  lectureId: string;
  now: Date;
}) {
  const rpcClient = serviceRoleSupabase as unknown as {
    rpc: (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ error: unknown }>;
  };
  const { error } = await rpcClient.rpc("refresh_lecture_sessions_for_server", {
    target_lecture_id: lectureId,
    from_date: getTodayInSeoul(now),
  });

  if (error) {
    console.error("refresh lecture sessions failed", error);
    throw new Error("failed to refresh lecture sessions");
  }
}

async function syncFutureSessionAttendances({
  serviceRoleSupabase,
  lectureId,
  studentId,
  syncMode,
  now,
}: {
  serviceRoleSupabase: TeacherSettingsServiceRoleClient;
  lectureId: string;
  studentId: string;
  syncMode: "add" | "remove";
  now: Date;
}) {
  const rpcClient = serviceRoleSupabase as unknown as {
    rpc: (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ error: unknown }>;
  };
  const { error } = await rpcClient.rpc(
    "sync_future_session_attendances_for_server",
    {
      target_lecture_id: lectureId,
      target_student_id: studentId,
      sync_mode: syncMode,
      from_date: getTodayInSeoul(now),
    },
  );

  if (error) {
    console.error("sync future session attendances failed", error);
    throw new Error("failed to sync future session attendances");
  }
}

function buildAttendanceSessionRangeFilter({
  startDate,
  endDate,
  startPeriod,
  endPeriod,
}: {
  startDate: string;
  endDate: string;
  startPeriod: number;
  endPeriod: number;
}) {
  if (startDate === endDate) {
    return undefined;
  }

  return [
    `and(session_date.eq.${startDate},period.gte.${startPeriod})`,
    `and(session_date.gt.${startDate},session_date.lt.${endDate})`,
    `and(session_date.eq.${endDate},period.lte.${endPeriod})`,
  ].join(",");
}

export async function handleTeacherSettingsAction({
  request,
  supabase,
  serviceRoleSupabase,
  userId,
  generateId = randomUUID,
  generateToken = () => randomBytes(24).toString("hex"),
  now = () => new Date(),
}: {
  request: Request;
  supabase: TeacherSettingsSupabaseClient;
  serviceRoleSupabase: TeacherSettingsServiceRoleClient;
  userId: string;
  generateId?: () => string;
  generateToken?: () => string;
  now?: () => Date;
}): Promise<TeacherSettingsActionResult> {
  const formData = await request.formData();
  const intent = toRequiredString(formData.get("intent"), "intent");
  const actor = await loadTeacherActor({ supabase, userId });

  if (intent === "update-profile") {
    const name = toRequiredString(formData.get("name"), "name");
    const { error } = await supabase
      .from("teachers")
      .update({ name })
      .eq("id", actor.id);

    if (error) {
      throw error;
    }

    return { ok: true, message: "프로필을 저장했습니다.", intent };
  }

  if (intent === "create-teacher-client") {
    const name = toRequiredString(formData.get("name"), "name");
    const token = generateToken();
    const client = {
      id: generateId(),
      school_id: actor.school_id,
      name,
      token_hash: hashToken(token),
      owner_teacher_id: actor.id,
      default_classroom_id: null,
      active: true,
    };

    const { error } = await supabase.from("attendance_clients").insert(client);
    if (error) {
      throw error;
    }

    return {
      ok: true,
      message: "클라이언트를 등록했습니다.",
      intent,
      clientId: client.id,
      token,
    };
  }

  if (intent === "create-classroom-client") {
    ensureAdmin(actor);
    const name = toRequiredString(formData.get("name"), "name");
    const token = generateToken();
    const defaultClassroomName = toRequiredString(
      formData.get("defaultClassroomName"),
      "defaultClassroomName",
    );
    const defaultClassroomId = await resolveClassroomId({
      supabase,
      schoolId: actor.school_id,
      classroomName: defaultClassroomName,
      generateId,
    });
    const client = {
      id: generateId(),
      school_id: actor.school_id,
      name,
      token_hash: hashToken(token),
      owner_teacher_id: null,
      default_classroom_id: defaultClassroomId,
      active: true,
    };

    const { error } = await supabase.from("attendance_clients").insert(client);
    if (error) {
      throw error;
    }

    return {
      ok: true,
      message: "클라이언트를 등록했습니다.",
      intent,
      clientId: client.id,
      token,
    };
  }

  if (
    intent === "deactivate-client" ||
    intent === "reactivate-client" ||
    intent === "delete-client"
  ) {
    const clientId = toRequiredString(formData.get("clientId"), "clientId");
    const { data: client, error: clientError } = await supabase
      .from("attendance_clients")
      .select("id, school_id, owner_teacher_id, default_classroom_id")
      .eq("id", clientId)
      .maybeSingle();

    if (clientError || !client?.id || client.school_id !== actor.school_id) {
      throw clientError ?? new Error("client not found");
    }

    const isTeacherClient = Boolean(client.owner_teacher_id);
    const isClassroomClient = Boolean(client.default_classroom_id);

    if (!actor.is_admin) {
      if (!isTeacherClient || client.owner_teacher_id !== actor.id) {
        throw new Error("teachers can only manage their own teacher clients");
      }
    } else if (
      !(
        (isTeacherClient && client.owner_teacher_id === actor.id) ||
        (isClassroomClient && client.owner_teacher_id === null)
      )
    ) {
      throw new Error("admins can only manage classroom clients");
    }

    if (intent === "delete-client") {
      const { error } = await supabase
        .from("attendance_clients")
        .delete()
        .eq("id", clientId);

      if (error) {
        throw error;
      }

      return { ok: true, message: "클라이언트를 삭제했습니다." };
    }

    const { error } = await supabase
      .from("attendance_clients")
      .update({ active: intent === "reactivate-client" })
      .eq("id", clientId);

    if (error) {
      throw error;
    }

    return {
      ok: true,
      message:
        intent === "reactivate-client"
          ? "클라이언트를 재활성화했습니다."
          : "클라이언트를 비활성화했습니다.",
      intent,
    };
  }

  if (intent === "create-lecture") {
    const lectureId = generateId();
    const lecture = {
      id: lectureId,
      teacher_id: actor.id,
      name: toRequiredString(formData.get("name"), "name"),
      module: toOptionalString(formData.get("module")) ?? null,
      classroom_id: toRequiredString(
        formData.get("classroomId"),
        "classroomId",
      ),
      semester_id: toOptionalNumber(formData.get("semesterId")) ?? null,
      schedule: parseJsonArrayField(formData.get("scheduleJson")),
      holiday: parseJsonArrayField(formData.get("holidayJson")),
    };

    const { error } = await supabase.from("lectures").insert(lecture);
    if (error) {
      throw error;
    }

    await refreshLectureSessions({
      serviceRoleSupabase,
      lectureId,
      now: now(),
    });

    return { ok: true, message: "수업을 등록했습니다.", intent };
  }

  if (intent === "update-lecture") {
    const lectureId = toRequiredString(formData.get("lectureId"), "lectureId");
    const update = {
      name: toRequiredString(formData.get("name"), "name"),
      module: toOptionalString(formData.get("module")) ?? null,
      classroom_id: toRequiredString(
        formData.get("classroomId"),
        "classroomId",
      ),
      semester_id: toOptionalNumber(formData.get("semesterId")) ?? null,
      schedule: parseJsonArrayField(formData.get("scheduleJson")),
      holiday: parseJsonArrayField(formData.get("holidayJson")),
    };

    const { error } = await supabase
      .from("lectures")
      .update(update)
      .eq("id", lectureId);

    if (error) {
      throw error;
    }

    await refreshLectureSessions({
      serviceRoleSupabase,
      lectureId,
      now: now(),
    });

    return { ok: true, message: "수업을 수정했습니다.", intent };
  }

  if (intent === "add-student-to-lecture") {
    const lectureId = toRequiredString(formData.get("lectureId"), "lectureId");
    const studentId = toRequiredString(formData.get("studentId"), "studentId");
    const semesterId = toOptionalNumber(formData.get("semesterId"));
    const { error } = await supabase.from("enrollments").insert({
      lecture_id: lectureId,
      student_id: studentId,
      semester_id: semesterId ?? null,
    });

    if (error) {
      throw error;
    }

    await syncFutureSessionAttendances({
      serviceRoleSupabase,
      lectureId,
      studentId,
      syncMode: "add",
      now: now(),
    });

    return { ok: true, message: "학생을 수업에 추가했습니다.", intent };
  }

  if (intent === "remove-student-from-lecture") {
    const lectureId = toRequiredString(formData.get("lectureId"), "lectureId");
    const studentId = toRequiredString(formData.get("studentId"), "studentId");
    const { error } = await supabase
      .from("enrollments")
      .delete()
      .match({ lecture_id: lectureId, student_id: studentId });

    if (error) {
      throw error;
    }

    await syncFutureSessionAttendances({
      serviceRoleSupabase,
      lectureId,
      studentId,
      syncMode: "remove",
      now: now(),
    });

    return { ok: true, message: "학생을 수업에서 제거했습니다.", intent };
  }

  if (intent === "create-student") {
    ensureAdmin(actor);
    const { error } = await supabase.from("students").insert({
      id: generateId(),
      school_id: actor.school_id,
      name: toRequiredString(formData.get("name"), "name"),
      num: toRequiredString(formData.get("num"), "num"),
      device_id: toOptionalString(formData.get("deviceId")) ?? null,
      status: "active",
    });

    if (error) {
      throw error;
    }

    return { ok: true, message: "학생을 등록했습니다.", intent };
  }

  if (intent === "update-student-status") {
    ensureAdmin(actor);
    const status = toRequiredString(formData.get("status"), "status");
    if (!isStudentStatus(status)) {
      throw new Error("invalid student status");
    }

    const { error } = await supabase
      .from("students")
      .update({ status })
      .eq("id", toRequiredString(formData.get("studentId"), "studentId"));

    if (error) {
      throw error;
    }

    return { ok: true, message: "학생 상태를 변경했습니다.", intent };
  }

  if (intent === "create-teacher-account") {
    ensureAdmin(actor);
    const name = toRequiredString(formData.get("name"), "name");
    const email = toRequiredString(formData.get("email"), "email");
    const password = toRequiredString(formData.get("password"), "password");
    const isAdmin = formData.get("isAdmin") === "on";

    const { data, error: createUserError } =
      await serviceRoleSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name },
      });

    if (createUserError || !data.user?.id) {
      throw createUserError ?? new Error("failed to create auth user");
    }

    const { error } = await supabase.from("teachers").insert({
      id: generateId(),
      user_id: data.user.id,
      school_id: actor.school_id,
      name,
      is_admin: isAdmin,
    });

    if (error) {
      throw error;
    }

    return { ok: true, message: "선생 계정을 생성했습니다.", intent };
  }

  if (intent === "delete-teacher-account") {
    ensureAdmin(actor);
    const teacherId = toRequiredString(formData.get("teacherId"), "teacherId");
    if (teacherId === actor.id) {
      throw new Error("cannot delete own teacher account");
    }

    const { data: targetTeacher, error: targetTeacherError } = await supabase
      .from("teachers")
      .select("id, school_id, user_id, is_admin, name")
      .eq("id", teacherId)
      .single();

    if (targetTeacherError || !targetTeacher?.id) {
      throw targetTeacherError ?? new Error("teacher not found");
    }

    if (targetTeacher.school_id !== actor.school_id) {
      throw new Error("teacher is outside of your school");
    }

    if (targetTeacher.user_id) {
      const { error } = await serviceRoleSupabase.auth.admin.deleteUser(
        targetTeacher.user_id,
      );
      if (error) {
        throw error;
      }
    }

    const { error: updateError } = await supabase
      .from("teachers")
      .update({ is_admin: false })
      .eq("id", teacherId);

    if (updateError) {
      throw updateError;
    }

    return { ok: true, message: "선생 계정을 삭제했습니다.", intent };
  }

  if (intent === "mark-attendance") {
    ensureAdmin(actor);
    const { studentId, status, startDate, endDate, startPeriod, endPeriod } =
      parseAttendanceMarkInput({
        studentId: formData.get("studentId"),
        status: formData.get("status"),
        startDate: formData.get("startDate"),
        endDate: formData.get("endDate"),
        startPeriod: formData.get("startPeriod"),
        endPeriod: formData.get("endPeriod"),
      });

    const sessionQuery = supabase
      .from("lecture_sessions")
      .select("id")
      .eq("school_id", actor.school_id);

    const sessionRangeFilter = buildAttendanceSessionRangeFilter({
      startDate,
      endDate,
      startPeriod,
      endPeriod,
    });

    const { data: sessions, error: sessionsError } =
      startDate === endDate
        ? await sessionQuery
            .eq("session_date", startDate)
            .gte("period", startPeriod)
            .lte("period", endPeriod)
        : await sessionQuery.or(sessionRangeFilter ?? "");

    if (sessionsError) {
      throw sessionsError;
    }

    if (!sessions || sessions.length === 0) {
      return { ok: true, message: "해당 기간/교시에 세션이 없습니다.", intent };
    }

    const sessionIds = sessions.map((s) => s.id);

    const { data: rows, error: updateError } = await supabase
      .from("attendances")
      .update({ status })
      .eq("student_id", studentId)
      .in("lecture_session_id", sessionIds)
      .select();

    if (updateError) {
      throw updateError;
    }

    if (!rows || rows.length === 0) {
      return {
        ok: true,
        message: "해당 기간/교시에 처리할 출석 대상이 없습니다.",
        intent,
      };
    }

    return {
      ok: true,
      message: `${rows.length}개 세션의 출석 상태를 저장했습니다.`,
      intent,
    };
  }

  throw new Error(`unsupported intent: ${intent}`);
}
