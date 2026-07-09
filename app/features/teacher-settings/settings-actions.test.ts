import { describe, expect, it, vi } from "vitest";

import { handleTeacherSettingsAction } from "./settings-actions";

type ActionSupabaseOptions = {
  actorIsAdmin?: boolean;
  teacherUserId?: string | null;
  classrooms?: Array<{
    id: string;
    name: string;
    school_id: string | null;
  }>;
  classroomInsertError?: {
    code: string;
    concurrentClassroom?: {
      id: string;
      name: string;
      school_id: string | null;
    };
  };
  attendanceClient?: {
    id: string;
    school_id: string;
    owner_teacher_id: string | null;
    default_classroom_id: string | null;
    active?: boolean;
    name?: string;
  };
  matchingSessionIds?: string[];
  matchingAttendanceCount?: number;
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
  const lectureSessionFilters: Array<{
    method: string;
    args: unknown[];
  }> = [];
  const classrooms = [
    ...(options.classrooms ?? [
      { id: "classroom-1", name: "Room A", school_id: "school-1" },
    ]),
  ];

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
        const attendanceClient = options.attendanceClient ?? {
          id: "client-1",
          school_id: "school-1",
          owner_teacher_id: "teacher-row-1",
          default_classroom_id: null,
          active: true,
          name: "Teacher Laptop",
        };

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
                data: attendanceClient,
                error: null,
              }),
              maybeSingle: vi.fn().mockResolvedValue({
                data: attendanceClient,
                error: null,
              }),
            })),
          })),
          delete: vi.fn(() => ({
            eq: vi.fn((id: string) => {
              deletes.push({ table, filters: { id } });
              return Promise.resolve({ error: null });
            }),
          })),
        };
      }

      if (table === "classrooms") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((column: string, value: string) => ({
              order: vi.fn().mockResolvedValue({
                data: classrooms.filter((classroom) =>
                  column === "school_id" ? classroom.school_id === value : true,
                ),
                error: null,
              }),
            })),
          })),
          insert: vi.fn(
            (values: { id: string; name: string; school_id: string }) => {
              inserts.push({ table, values });

              if (options.classroomInsertError) {
                if (options.classroomInsertError.concurrentClassroom) {
                  classrooms.push(
                    options.classroomInsertError.concurrentClassroom,
                  );
                }

                return Promise.resolve({
                  error: {
                    code: options.classroomInsertError.code,
                    message: "simulated classroom insert error",
                  },
                });
              }

              classrooms.push(values);

              return Promise.resolve({ error: null });
            },
          ),
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

      if (table === "lecture_sessions") {
        const sessionIds = options.matchingSessionIds ?? [
          "session-1",
          "session-2",
        ];
        const result = Promise.resolve({
          data: sessionIds.map((id: string) => ({ id })),
          error: null,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const builder: Record<string, any> = {
          select: vi.fn(() => builder),
          eq: vi.fn((...args: unknown[]) => {
            lectureSessionFilters.push({ method: "eq", args });
            return builder;
          }),
          gte: vi.fn((...args: unknown[]) => {
            lectureSessionFilters.push({ method: "gte", args });
            return builder;
          }),
          lte: vi.fn((...args: unknown[]) => {
            lectureSessionFilters.push({ method: "lte", args });
            return builder;
          }),
          or: vi.fn((...args: unknown[]) => {
            lectureSessionFilters.push({ method: "or", args });
            return builder;
          }),
          then: result.then.bind(result),
        };
        return builder;
      }

      if (table === "attendances") {
        const attendanceCount = options.matchingAttendanceCount ?? 2;
        return {
          upsert: vi.fn((values: unknown) => {
            upserts.push({ table, values });
            return Promise.resolve({ error: null });
          }),
          update: vi.fn((values: unknown) => {
            updates.push({ table, values });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const filter: Record<string, any> = {
              eq: vi.fn(() => filter),
              in: vi.fn(() => filter),
              select: vi.fn(() =>
                Promise.resolve({
                  data:
                    attendanceCount > 0
                      ? Array.from({ length: attendanceCount }, (_, i) => ({
                          id: `att-${String(i)}`,
                          status: (values as Record<string, string>).status,
                        }))
                      : [],
                  error: null,
                }),
              ),
            };
            return filter;
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

  return {
    supabase,
    inserts,
    updates,
    deletes,
    upserts,
    rpcs,
    lectureSessionFilters,
  };
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
  let generatedIdCount = 0;
  const result = await handleTeacherSettingsAction({
    request,
    supabase: actionSupabase.supabase as never,
    serviceRoleSupabase: serviceRoleSupabase as never,
    userId: "user-1",
    generateId: () => {
      const count = generatedIdCount;
      generatedIdCount += 1;

      return count === 0 ? "generated-id" : `generated-id-${count + 1}`;
    },
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

  it("creates a teacher client for the signed-in teacher and returns the raw token once", async () => {
    const { result, inserts } = await submitAction({
      intent: "create-teacher-client",
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
        default_classroom_id: null,
      }),
    });
  });

  it("creates a classroom client for school admins", async () => {
    const { result, inserts } = await submitAction(
      {
        intent: "create-classroom-client",
        name: "Room A Tablet",
        defaultClassroomName: "Room A",
      },
      { actorIsAdmin: true },
    );

    expect(result).toMatchObject({ ok: true, token: "plain-text-token" });
    expect(inserts).toContainEqual({
      table: "attendance_clients",
      values: expect.objectContaining({
        owner_teacher_id: null,
        default_classroom_id: "classroom-1",
        school_id: "school-1",
      }),
    });
  });

  it("rejects classroom client creation for non-admin teachers", async () => {
    await expect(
      submitAction({
        intent: "create-classroom-client",
        name: "Room A Tablet",
        defaultClassroomName: "Room A",
      }),
    ).rejects.toThrow("admin privileges are required");
  });

  it("creates a new classroom when the typed classroom name does not exist", async () => {
    const { result, inserts } = await submitAction(
      {
        intent: "create-classroom-client",
        name: "Room B Tablet",
        defaultClassroomName: "  Room B202  ",
      },
      { actorIsAdmin: true },
    );

    expect(result).toMatchObject({ ok: true, token: "plain-text-token" });
    expect(inserts).toContainEqual({
      table: "classrooms",
      values: {
        id: "generated-id",
        name: "Room B202",
        school_id: "school-1",
      },
    });
    expect(inserts).toContainEqual({
      table: "attendance_clients",
      values: expect.objectContaining({
        id: "generated-id-2",
        default_classroom_id: "generated-id",
        owner_teacher_id: null,
      }),
    });
  });

  it("reuses a concurrently created classroom after a unique-name conflict", async () => {
    const { result, inserts } = await submitAction(
      {
        intent: "create-classroom-client",
        name: "Room B Tablet",
        defaultClassroomName: "Room B202",
      },
      {
        actorIsAdmin: true,
        classrooms: [],
        classroomInsertError: {
          code: "23505",
          concurrentClassroom: {
            id: "classroom-2",
            name: "room b202",
            school_id: "school-1",
          },
        },
      },
    );

    expect(result).toMatchObject({ ok: true, token: "plain-text-token" });
    expect(inserts).toContainEqual({
      table: "attendance_clients",
      values: expect.objectContaining({
        default_classroom_id: "classroom-2",
      }),
    });
  });

  it("requires a classroom name when creating a classroom client", async () => {
    await expect(
      submitAction(
        {
          intent: "create-classroom-client",
          name: "Room A Tablet",
          defaultClassroomName: "   ",
        },
        { actorIsAdmin: true },
      ),
    ).rejects.toThrow("교실 이름을 입력해 주세요.");
  });

  it("allows admins to create their own teacher client", async () => {
    const { result, inserts } = await submitAction(
      {
        intent: "create-teacher-client",
        name: "Principal Laptop",
      },
      { actorIsAdmin: true },
    );

    expect(result).toMatchObject({ ok: true, token: "plain-text-token" });
    expect(inserts).toContainEqual({
      table: "attendance_clients",
      values: expect.objectContaining({
        owner_teacher_id: "teacher-row-1",
        default_classroom_id: null,
        name: "Principal Laptop",
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
    expect(addResult.serviceRoleSupabase.rpcs).toContainEqual({
      schema: "public",
      fn: "sync_future_session_attendances_for_server",
      args: {
        target_lecture_id: "lecture-1",
        target_student_id: "student-1",
        sync_mode: "add",
        from_date: "2026-07-08",
      },
    });
    expect(removeResult.result).toEqual({
      ok: true,
      message: "학생을 수업에서 제거했습니다.",
    });
    expect(removeResult.serviceRoleSupabase.rpcs).toContainEqual({
      schema: "public",
      fn: "sync_future_session_attendances_for_server",
      args: {
        target_lecture_id: "lecture-1",
        target_student_id: "student-1",
        sync_mode: "remove",
        from_date: "2026-07-08",
      },
    });
    expect(removeResult.deletes).toContainEqual({
      table: "enrollments",
      filters: { lecture_id: "lecture-1", student_id: "student-1" },
    });
  });

  it("deactivates, reactivates, and deletes a teacher-owned client", async () => {
    const deactivateResult = await submitAction({
      intent: "deactivate-client",
      clientId: "client-1",
    });
    const reactivateResult = await submitAction({
      intent: "reactivate-client",
      clientId: "client-1",
    });
    const deleteResult = await submitAction({
      intent: "delete-client",
      clientId: "client-1",
    });

    expect(deactivateResult.result).toEqual({
      ok: true,
      message: "클라이언트를 비활성화했습니다.",
    });
    expect(deactivateResult.updates).toContainEqual({
      table: "attendance_clients",
      values: { active: false },
    });

    expect(reactivateResult.result).toEqual({
      ok: true,
      message: "클라이언트를 재활성화했습니다.",
    });
    expect(reactivateResult.updates).toContainEqual({
      table: "attendance_clients",
      values: { active: true },
    });

    expect(deleteResult.result).toEqual({
      ok: true,
      message: "클라이언트를 삭제했습니다.",
    });
  });

  it("allows admins to manage classroom clients only", async () => {
    const classroomClient = {
      id: "client-2",
      school_id: "school-1",
      owner_teacher_id: null,
      default_classroom_id: "classroom-1",
      active: false,
      name: "Room A Tablet",
    };

    const reactivateResult = await submitAction(
      {
        intent: "reactivate-client",
        clientId: "client-2",
      },
      { actorIsAdmin: true, attendanceClient: classroomClient },
    );
    const deleteResult = await submitAction(
      {
        intent: "delete-client",
        clientId: "client-2",
      },
      { actorIsAdmin: true, attendanceClient: classroomClient },
    );

    expect(reactivateResult.result.ok).toBe(true);
    expect(deleteResult.result.ok).toBe(true);
  });

  it("allows admins to manage their own teacher-owned clients", async () => {
    const teacherClient = {
      id: "client-3",
      school_id: "school-1",
      owner_teacher_id: "teacher-row-1",
      default_classroom_id: null,
      active: true,
      name: "Principal Laptop",
    };

    const deactivateResult = await submitAction(
      {
        intent: "deactivate-client",
        clientId: "client-3",
      },
      { actorIsAdmin: true, attendanceClient: teacherClient },
    );
    const deleteResult = await submitAction(
      {
        intent: "delete-client",
        clientId: "client-3",
      },
      { actorIsAdmin: true, attendanceClient: teacherClient },
    );

    expect(deactivateResult.result.ok).toBe(true);
    expect(deleteResult.result.ok).toBe(true);
  });

  it("rejects admins deleting another teacher's teacher-owned clients", async () => {
    await expect(
      submitAction(
        {
          intent: "delete-client",
          clientId: "client-1",
        },
        {
          actorIsAdmin: true,
          attendanceClient: {
            id: "client-1",
            school_id: "school-1",
            owner_teacher_id: "teacher-row-9",
            default_classroom_id: null,
          },
        },
      ),
    ).rejects.toThrow("admins can only manage classroom clients");
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

  describe("mark-attendance", () => {
    it("bulk-updates attendances for sessions in a continuous multi-day range", async () => {
      const { result, updates, lectureSessionFilters } = await submitAction(
        {
          intent: "mark-attendance",
          studentId: "student-1",
          startDate: "2026-07-01",
          endDate: "2026-07-10",
          startPeriod: "6",
          endPeriod: "2",
          status: "excused",
        },
        {
          actorIsAdmin: true,
          matchingSessionIds: ["s1", "s2", "s3"],
          matchingAttendanceCount: 5,
        },
      );

      expect(result).toEqual({
        ok: true,
        message: "5개 세션의 출석 상태를 저장했습니다.",
      });
      expect(updates).toContainEqual({
        table: "attendances",
        values: { status: "excused" },
      });
      expect(lectureSessionFilters).toContainEqual({
        method: "eq",
        args: ["school_id", "school-1"],
      });
      expect(lectureSessionFilters).toContainEqual({
        method: "or",
        args: [
          "and(session_date.eq.2026-07-01,period.gte.6),and(session_date.gt.2026-07-01,session_date.lt.2026-07-10),and(session_date.eq.2026-07-10,period.lte.2)",
        ],
      });
    });

    it("uses a same-day period range when start and end dates match", async () => {
      const { result, lectureSessionFilters } = await submitAction(
        {
          intent: "mark-attendance",
          studentId: "student-1",
          startDate: "2026-07-01",
          endDate: "2026-07-01",
          startPeriod: "1",
          endPeriod: "4",
          status: "excused",
        },
        {
          actorIsAdmin: true,
          matchingSessionIds: ["s1"],
        },
      );

      expect(result.ok).toBe(true);
      expect(lectureSessionFilters).toContainEqual({
        method: "eq",
        args: ["school_id", "school-1"],
      });
      expect(lectureSessionFilters).toContainEqual({
        method: "eq",
        args: ["session_date", "2026-07-01"],
      });
      expect(lectureSessionFilters).toContainEqual({
        method: "gte",
        args: ["period", 1],
      });
      expect(lectureSessionFilters).toContainEqual({
        method: "lte",
        args: ["period", 4],
      });
      expect(
        lectureSessionFilters.some((filter) => filter.method === "or"),
      ).toBe(false);
    });

    it("returns a message when no lecture sessions match the range", async () => {
      const { result, updates } = await submitAction(
        {
          intent: "mark-attendance",
          studentId: "student-1",
          startDate: "2026-08-01",
          endDate: "2026-08-10",
          startPeriod: "1",
          endPeriod: "4",
          status: "excused",
        },
        {
          actorIsAdmin: true,
          matchingSessionIds: [],
        },
      );

      expect(result).toEqual({
        ok: true,
        message: "해당 기간/교시에 세션이 없습니다.",
      });
      expect(updates).toHaveLength(0);
    });

    it("returns a message when no attendances exist for matching sessions", async () => {
      const { result } = await submitAction(
        {
          intent: "mark-attendance",
          studentId: "student-1",
          startDate: "2026-07-01",
          endDate: "2026-07-10",
          startPeriod: "1",
          endPeriod: "4",
          status: "excused",
        },
        {
          actorIsAdmin: true,
          matchingSessionIds: ["s1"],
          matchingAttendanceCount: 0,
        },
      );

      expect(result).toEqual({
        ok: true,
        message: "해당 기간/교시에 처리할 출석 대상이 없습니다.",
      });
    });

    it("rejects when start date is after end date", async () => {
      await expect(
        submitAction(
          {
            intent: "mark-attendance",
            studentId: "student-1",
            startDate: "2026-07-10",
            endDate: "2026-07-01",
            startPeriod: "1",
            endPeriod: "4",
            status: "excused",
          },
          { actorIsAdmin: true },
        ),
      ).rejects.toThrow("종료일은 시작일보다 이후여야 합니다.");
    });

    it("rejects when start period is after end period on the same day", async () => {
      await expect(
        submitAction(
          {
            intent: "mark-attendance",
            studentId: "student-1",
            startDate: "2026-07-01",
            endDate: "2026-07-01",
            startPeriod: "4",
            endPeriod: "1",
            status: "excused",
          },
          { actorIsAdmin: true },
        ),
      ).rejects.toThrow(
        "같은 날짜에서는 종료 교시가 시작 교시보다 작을 수 없습니다.",
      );
    });

    it("rejects non-admin teachers", async () => {
      await expect(
        submitAction({
          intent: "mark-attendance",
          studentId: "student-1",
          startDate: "2026-07-01",
          endDate: "2026-07-10",
          startPeriod: "1",
          endPeriod: "4",
          status: "excused",
        }),
      ).rejects.toThrow("admin privileges are required");
    });
  });
});
