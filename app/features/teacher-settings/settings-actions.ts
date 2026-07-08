import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~/types/database.types";
import {
  getTodayInSeoul,
  isAttendanceOverrideStatus,
  isStudentStatus,
  parseJsonArrayField,
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

    return { ok: true, message: "프로필을 저장했습니다." };
  }

  if (intent === "create-client") {
    const name = toRequiredString(formData.get("name"), "name");
    const token = generateToken();
    const ownerTeacherId = toOptionalString(formData.get("ownerTeacherId"));
    const defaultClassroomId = toOptionalString(
      formData.get("defaultClassroomId"),
    );
    const client = {
      id: generateId(),
      school_id: actor.school_id,
      name,
      token_hash: hashToken(token),
      owner_teacher_id: actor.is_admin
        ? (ownerTeacherId ?? actor.id)
        : actor.id,
      default_classroom_id: defaultClassroomId ?? null,
      active: true,
    };

    const { error } = await supabase.from("attendance_clients").insert(client);
    if (error) {
      throw error;
    }

    return { ok: true, message: "클라이언트를 등록했습니다.", token };
  }

  if (intent === "deactivate-client") {
    const clientId = toRequiredString(formData.get("clientId"), "clientId");
    const { error } = await supabase
      .from("attendance_clients")
      .update({ active: false })
      .eq("id", clientId);

    if (error) {
      throw error;
    }

    return { ok: true, message: "클라이언트를 비활성화했습니다." };
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

    return { ok: true, message: "수업을 등록했습니다." };
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

    return { ok: true, message: "수업을 수정했습니다." };
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

    return { ok: true, message: "학생을 수업에 추가했습니다." };
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

    return { ok: true, message: "학생을 수업에서 제거했습니다." };
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

    return { ok: true, message: "학생을 등록했습니다." };
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

    return { ok: true, message: "학생 상태를 변경했습니다." };
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

    return { ok: true, message: "선생 계정을 생성했습니다." };
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

    return { ok: true, message: "선생 계정을 삭제했습니다." };
  }

  if (intent === "mark-attendance") {
    ensureAdmin(actor);
    const status = toRequiredString(formData.get("status"), "status");
    if (!isAttendanceOverrideStatus(status)) {
      throw new Error("invalid attendance status");
    }

    const { error } = await supabase.from("attendances").upsert(
      {
        lecture_session_id: toRequiredString(
          formData.get("lectureSessionId"),
          "lectureSessionId",
        ),
        student_id: toRequiredString(formData.get("studentId"), "studentId"),
        status,
      },
      {
        onConflict: "student_id,lecture_session_id",
      },
    );

    if (error) {
      throw error;
    }

    return { ok: true, message: "출석 상태를 저장했습니다." };
  }

  throw new Error(`unsupported intent: ${intent}`);
}
