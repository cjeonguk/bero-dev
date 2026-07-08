import { describe, expect, it, vi } from "vitest";

import { handleTeacherSettingsAction } from "./settings-actions";

type ActionSupabaseOptions = {
  actorIsAdmin?: boolean;
  teacherUserId?: string | null;
};

function createActionSupabase(options: ActionSupabaseOptions = {}) {
  const updates: Array<{ table: string; values: unknown }> = [];
  const inserts: Array<{ table: string; values: unknown }> = [];
  const deletes: Array<{ table: string; filters: Record<string, unknown> }> =
    [];
  const upserts: Array<{ table: string; values: unknown }> = [];
  const rpcs: Array<{
    schema: string;
    fn: string;
    args: Record<string, unknown>;
  }> = [];

  const actor = {
    id: "teacher-row-1",
    school_id: "school-1",
    name: "Teacher Bravo",
    is_admin: options.actorIsAdmin ?? false,
  };

  const supabase = {
    from: vi.fn((table: string) => {
      if (table === "teachers") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((column: string, value: string) => {
              if (column === "user_id") {
                return {
                  single: vi
                    .fn()
                    .mockResolvedValue({ data: actor, error: null }),
                };
              }

              return {
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: value,
                    school_id: "school-1",
                    user_id: options.teacherUserId ?? "target-user-1",
                    is_admin: false,
                    name: "Target Teacher",
                  },
                  error: null,
                }),
              };
            }),
          })),
          update: vi.fn((values: unknown) => {
            updates.push({ table, values });
            return {
              eq: vi.fn().mockResolvedValue({ error: null }),
            };
          }),
          insert: vi.fn((values: unknown) => {
            inserts.push({ table, values });
            return Promise.resolve({ error: null });
          }),
        };
      }

      if (table === "attendance_clients") {
        return {
          insert: vi.fn((values: unknown) => {
            inserts.push({ table, values });
            return Promise.resolve({ error: null });
          }),
          update: vi.fn((values: unknown) => {
            updates.push({ table, values });
            return {
              eq: vi.fn().mockResolvedValue({ error: null }),
            };
          }),
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "client-1",
                  school_id: "school-1",
                  owner_teacher_id: "teacher-row-1",
                },
                error: null,
              }),
            })),
          })),
        };
      }

      if (table === "lectures") {
        return {
          insert: vi.fn((values: unknown) => {
            inserts.push({ table, values });
            return Promise.resolve({ error: null });
          }),
          update: vi.fn((values: unknown) => {
            updates.push({ table, values });
            return {
              eq: vi.fn().mockResolvedValue({ error: null }),
            };
          }),
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "lecture-1",
                  teacher_id: "teacher-row-1",
                  semester_id: 2,
                },
                error: null,
              }),
            })),
          })),
        };
      }

      if (table === "enrollments") {
        return {
          insert: vi.fn((values: unknown) => {
            inserts.push({ table, values });
            return Promise.resolve({ error: null });
          }),
          delete: vi.fn(() => ({
            match: vi.fn((filters: Record<string, unknown>) => {
              deletes.push({ table, filters });
              return Promise.resolve({ error: null });
            }),
          })),
        };
      }

      if (table === "students") {
        return {
          insert: vi.fn((values: unknown) => {
            inserts.push({ table, values });
            return Promise.resolve({ error: null });
          }),
          update: vi.fn((values: unknown) => {
            updates.push({ table, values });
            return {
              eq: vi.fn().mockResolvedValue({ error: null }),
            };
          }),
        };
      }

      if (table === "attendances") {
        return {
          upsert: vi.fn((values: unknown) => {
            upserts.push({ table, values });
            return Promise.resolve({ error: null });
          }),
        };
      }

      throw new Error(`unexpected table ${table}`);
    }),
    schema: vi.fn((schemaName: string) => ({
      rpc: vi.fn((fn: string, args: Record<string, unknown>) => {
        rpcs.push({ schema: schemaName, fn, args });
        return Promise.resolve({ error: null });
      }),
    })),
  };

  return { supabase, inserts, updates, deletes, upserts, rpcs };
}

function createServiceRoleSupabase() {
  const rpcs: Array<{
    schema: string;
    fn: string;
    args: Record<string, unknown>;
  }> = [];
  let refreshLectureSessionsError: Error | null = null;

  const rpc = vi.fn((fn: string, args: Record<string, unknown>) => {
    rpcs.push({ schema: "public", fn, args });
    return Promise.resolve({
      data: refreshLectureSessionsError ? null : 1,
      error: refreshLectureSessionsError,
    });
  });

  return {
    auth: {
      admin: {
        createUser: vi.fn().mockResolvedValue({
          data: { user: { id: "auth-user-2" } },
          error: null,
        }),
        deleteUser: vi
          .fn()
          .mockResolvedValue({ data: { user: null }, error: null }),
      },
    },
    rpc,
    schema: vi.fn((schemaName: string) => ({
      rpc: vi.fn((fn: string, args: Record<string, unknown>) => {
        rpcs.push({ schema: schemaName, fn, args });
        return rpc(fn, args);
      }),
    })),
    rpcs,
    setRefreshLectureSessionsError(error: Error | null) {
      refreshLectureSessionsError = error;
    },
  };
}

async function submitAction(
  form: Record<string, string>,
  options: ActionSupabaseOptions = {},
) {
  const request = new Request("https://example.com/teacher/settings", {
    method: "POST",
    body: new URLSearchParams(form),
  });
  const actionSupabase = createActionSupabase(options);
  const serviceRoleSupabase = createServiceRoleSupabase();
  const result = await handleTeacherSettingsAction({
    request,
    supabase: actionSupabase.supabase as never,
    serviceRoleSupabase: serviceRoleSupabase as never,
    userId: "user-1",
    generateId: () => "generated-id",
    generateToken: () => "plain-text-token",
    now: () => new Date("2026-07-08T12:00:00.000Z"),
  });

  return { result, serviceRoleSupabase, ...actionSupabase };
}

describe("handleTeacherSettingsAction", () => {
  it("updates the signed-in teacher profile name", async () => {
    const { result, updates } = await submitAction({
      intent: "update-profile",
      name: "Updated Teacher",
    });

    expect(result).toEqual({ ok: true, message: "프로필을 저장했습니다." });
    expect(updates).toContainEqual({
      table: "teachers",
      values: { name: "Updated Teacher" },
    });
  });

  it("creates an owned attendance client and returns the raw token once", async () => {
    const { result, inserts } = await submitAction({
      intent: "create-client",
      name: "Teacher Laptop",
    });

    expect(result).toMatchObject({
      ok: true,
      token: "plain-text-token",
    });
    expect(inserts).toContainEqual({
      table: "attendance_clients",
      values: expect.objectContaining({
        id: "generated-id",
        owner_teacher_id: "teacher-row-1",
        school_id: "school-1",
        name: "Teacher Laptop",
      }),
    });
  });

  it("creates a lecture and refreshes future lecture sessions", async () => {
    const { result, inserts, serviceRoleSupabase } = await submitAction({
      intent: "create-lecture",
      name: "Applied Science",
      module: "SCI-1",
      classroomId: "classroom-1",
      semesterId: "2",
      scheduleJson: '[{"day":"Monday","period":3}]',
      holidayJson: "[]",
    });

    expect(result).toEqual({ ok: true, message: "수업을 등록했습니다." });
    expect(inserts).toContainEqual({
      table: "lectures",
      values: expect.objectContaining({
        id: "generated-id",
        teacher_id: "teacher-row-1",
      }),
    });
    expect(serviceRoleSupabase.rpcs).toContainEqual({
      schema: "public",
      fn: "refresh_lecture_sessions_for_server",
      args: {
        target_lecture_id: "generated-id",
        from_date: "2026-07-08",
      },
    });
  });

  it("updates a lecture and refreshes future lecture sessions", async () => {
    const { result, updates, serviceRoleSupabase } = await submitAction({
      intent: "update-lecture",
      lectureId: "lecture-1",
      name: "Updated Science",
      module: "SCI-2",
      classroomId: "classroom-1",
      semesterId: "2",
      scheduleJson: '[{"day":"Tuesday","period":4}]',
      holidayJson: "[]",
    });

    expect(result).toEqual({ ok: true, message: "수업을 수정했습니다." });
    expect(updates).toContainEqual({
      table: "lectures",
      values: {
        name: "Updated Science",
        module: "SCI-2",
        classroom_id: "classroom-1",
        semester_id: 2,
        schedule: [{ day: "Tuesday", period: 4 }],
        holiday: [],
      },
    });
    expect(serviceRoleSupabase.rpcs).toContainEqual({
      schema: "public",
      fn: "refresh_lecture_sessions_for_server",
      args: {
        target_lecture_id: "lecture-1",
        from_date: "2026-07-08",
      },
    });
  });

  it("fails lecture update when lecture session refresh fails", async () => {
    const request = new Request("https://example.com/teacher/settings", {
      method: "POST",
      body: new URLSearchParams({
        intent: "update-lecture",
        lectureId: "lecture-1",
        name: "Updated Science",
        module: "SCI-2",
        classroomId: "classroom-1",
        semesterId: "2",
        scheduleJson: '[{"day":"Tuesday","period":4}]',
        holidayJson: "[]",
      }),
    });
    const actionSupabase = createActionSupabase();
    const serviceRoleSupabase = createServiceRoleSupabase();
    serviceRoleSupabase.setRefreshLectureSessionsError(
      new Error("permission denied for function refresh_lecture_sessions"),
    );

    await expect(
      handleTeacherSettingsAction({
        request,
        supabase: actionSupabase.supabase as never,
        serviceRoleSupabase: serviceRoleSupabase as never,
        userId: "user-1",
        now: () => new Date("2026-07-08T12:00:00.000Z"),
      }),
    ).rejects.toThrow("failed to refresh lecture sessions");
  });

  it("adds and removes students from a lecture", async () => {
    const addResult = await submitAction({
      intent: "add-student-to-lecture",
      lectureId: "lecture-1",
      studentId: "student-1",
      semesterId: "2",
    });
    const removeResult = await submitAction({
      intent: "remove-student-from-lecture",
      lectureId: "lecture-1",
      studentId: "student-1",
    });

    expect(addResult.result).toEqual({
      ok: true,
      message: "학생을 수업에 추가했습니다.",
    });
    expect(addResult.inserts).toContainEqual({
      table: "enrollments",
      values: {
        lecture_id: "lecture-1",
        student_id: "student-1",
        semester_id: 2,
      },
    });
    expect(removeResult.result).toEqual({
      ok: true,
      message: "학생을 수업에서 제거했습니다.",
    });
    expect(removeResult.deletes).toContainEqual({
      table: "enrollments",
      filters: { lecture_id: "lecture-1", student_id: "student-1" },
    });
  });

  it("creates and deactivates students as a school admin", async () => {
    const createResult = await submitAction(
      {
        intent: "create-student",
        name: "New Student",
        num: "12",
        deviceId: "device-12",
      },
      { actorIsAdmin: true },
    );
    const updateResult = await submitAction(
      {
        intent: "update-student-status",
        studentId: "student-1",
        status: "leave",
      },
      { actorIsAdmin: true },
    );

    expect(createResult.result).toEqual({
      ok: true,
      message: "학생을 등록했습니다.",
    });
    expect(createResult.inserts).toContainEqual({
      table: "students",
      values: expect.objectContaining({
        id: "generated-id",
        school_id: "school-1",
        status: "active",
      }),
    });
    expect(updateResult.result).toEqual({
      ok: true,
      message: "학생 상태를 변경했습니다.",
    });
    expect(updateResult.updates).toContainEqual({
      table: "students",
      values: { status: "leave" },
    });
  });

  it("creates and deletes teacher accounts as a school admin", async () => {
    const createResult = await submitAction(
      {
        intent: "create-teacher-account",
        name: "New Teacher",
        email: "new-teacher@example.com",
        password: "temporary-password",
        isAdmin: "on",
      },
      { actorIsAdmin: true },
    );
    const deleteResult = await submitAction(
      {
        intent: "delete-teacher-account",
        teacherId: "teacher-row-2",
      },
      { actorIsAdmin: true, teacherUserId: "auth-user-2" },
    );

    expect(createResult.result).toEqual({
      ok: true,
      message: "선생 계정을 생성했습니다.",
    });
    expect(createResult.inserts).toContainEqual({
      table: "teachers",
      values: expect.objectContaining({
        id: "generated-id",
        user_id: "auth-user-2",
        school_id: "school-1",
        is_admin: true,
      }),
    });
    expect(
      createResult.serviceRoleSupabase.auth.admin.createUser,
    ).toHaveBeenCalledWith({
      email: "new-teacher@example.com",
      password: "temporary-password",
      email_confirm: true,
      user_metadata: { name: "New Teacher" },
    });

    expect(deleteResult.result).toEqual({
      ok: true,
      message: "선생 계정을 삭제했습니다.",
    });
    expect(
      deleteResult.serviceRoleSupabase.auth.admin.deleteUser,
    ).toHaveBeenCalledWith("auth-user-2");
    expect(deleteResult.updates).toContainEqual({
      table: "teachers",
      values: { is_admin: false },
    });
  });

  it("marks attendance as excused or sick leave for school admins", async () => {
    const { result, upserts } = await submitAction(
      {
        intent: "mark-attendance",
        lectureSessionId: "session-1",
        studentId: "student-1",
        status: "excused",
      },
      { actorIsAdmin: true },
    );

    expect(result).toEqual({ ok: true, message: "출석 상태를 저장했습니다." });
    expect(upserts).toContainEqual({
      table: "attendances",
      values: {
        lecture_session_id: "session-1",
        student_id: "student-1",
        status: "excused",
      },
    });
  });
});
