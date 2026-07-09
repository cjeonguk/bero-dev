import { describe, expect, it, vi } from "vitest";

import { handleTeacherDashboardAction } from "./dashboard-actions";

type DashboardActionSupabaseOptions = {
  lectureSession?: {
    id: string;
    lecture_id: string | null;
    teacher_id: string;
    school_id: string;
    kind: "regular" | "makeup" | "special";
  } | null;
  attendanceStudentIds?: string[];
  activeSemesterId?: number | null;
  classroomExists?: boolean;
  sourceLecture?: {
    id: string;
    module: string | null;
    semester_id: number | null;
  } | null;
  enrollmentStudentIds?: string[];
  validStudentIds?: string[];
  conflictingSessions?: Array<{
    id: string;
    teacher_id: string;
    classroom_id: string;
  }>;
  insertedSessionId?: string;
};

function createDashboardActionSupabase(
  options: DashboardActionSupabaseOptions = {},
) {
  const attendanceUpserts: Array<{
    source: "dashboard" | "service-role";
    table: string;
    values: unknown;
    options?: unknown;
  }> = [];
  const sessionInserts: Array<{ table: string; values: unknown }> = [];
  const actor = {
    id: "teacher-1",
    school_id: "school-1",
    name: "Teacher Bravo",
    is_admin: false,
  };
  const lectureSession = options.lectureSession ?? {
    id: "session-2",
    lecture_id: "lecture-2",
    teacher_id: "teacher-1",
    school_id: "school-1",
    kind: "regular" as const,
  };
  const attendanceStudentIds = options.attendanceStudentIds ?? [
    "student-1",
    "student-2",
  ];
  const activeSemesterId = options.activeSemesterId ?? 1;
  const sourceLecture = options.sourceLecture ?? {
    id: "lecture-2",
    module: "Science",
    semester_id: 1,
  };
  const enrollmentStudentIds = options.enrollmentStudentIds ?? [
    "student-1",
    "student-2",
  ];
  const validStudentIds = options.validStudentIds ?? [
    "student-1",
    "student-2",
    "student-3",
  ];
  const conflictingSessions = options.conflictingSessions ?? [];
  const insertedSessionId = options.insertedSessionId ?? "session-created";

  const supabase = {
    from: vi.fn((table: string) => {
      if (table === "teachers") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: actor, error: null }),
            })),
          })),
        };
      }

      if (table === "lecture_sessions") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: lectureSession,
                error: null,
              }),
            })),
          })),
        };
      }

      if (table === "attendances") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({
              data: attendanceStudentIds.map((studentId) => ({
                student_id: studentId,
              })),
              error: null,
            }),
          })),
          upsert: vi.fn((values: unknown, upsertOptions?: unknown) => {
            attendanceUpserts.push({
              source: "dashboard",
              table,
              values,
              options: upsertOptions,
            });
            return Promise.resolve({ error: null });
          }),
        };
      }

      if (table === "semester_schedules") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              lte: vi.fn(() => ({
                gte: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data:
                      activeSemesterId === null
                        ? null
                        : { id: activeSemesterId },
                    error: null,
                  }),
                })),
              })),
            })),
          })),
        };
      }

      if (table === "lectures") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: sourceLecture,
                  error: null,
                }),
              })),
            })),
          })),
        };
      }

      if (table === "enrollments") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({
                data: enrollmentStudentIds.map((studentId) => ({
                  student_id: studentId,
                })),
                error: null,
              }),
            })),
          })),
        };
      }

      if (table === "students") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              in: vi.fn((_column: string, ids: string[]) =>
                Promise.resolve({
                  data: ids
                    .filter((id) => validStudentIds.includes(id))
                    .map((id) => ({ id })),
                  error: null,
                }),
              ),
            })),
          })),
        };
      }

      throw new Error(`unexpected table ${table}`);
    }),
  };

  const serviceRoleSupabase = {
    from: vi.fn((table: string) => {
      if (table === "classrooms") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({
                data:
                  options.classroomExists === false
                    ? []
                    : [{ id: "classroom-1", name: "Science Lab" }],
                error: null,
              }),
            })),
          })),
        };
      }

      if (table === "lecture_sessions") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn().mockResolvedValue({
                  data: conflictingSessions,
                  error: null,
                }),
              })),
            })),
          })),
          insert: vi.fn((values: unknown) => {
            sessionInserts.push({ table, values });
            return {
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { id: insertedSessionId },
                  error: null,
                }),
              })),
            };
          }),
        };
      }

      if (table === "attendances") {
        return {
          upsert: vi.fn((values: unknown, upsertOptions?: unknown) => {
            attendanceUpserts.push({
              source: "service-role",
              table,
              values,
              options: upsertOptions,
            });
            return Promise.resolve({ error: null });
          }),
        };
      }

      throw new Error(`unexpected service role table ${table}`);
    }),
  };

  return {
    supabase,
    serviceRoleSupabase,
    attendanceUpserts,
    sessionInserts,
  };
}

async function submitDashboardAction({
  form,
  sessionId = "session-2",
  url = "https://example.com/teacher/dashboard/session-2",
  options,
}: {
  form: URLSearchParams;
  sessionId?: string;
  url?: string;
  options?: DashboardActionSupabaseOptions;
}) {
  const request = new Request(url, {
    method: "POST",
    body: form,
  });
  const actionSupabase = createDashboardActionSupabase(options);
  const result = await handleTeacherDashboardAction({
    request,
    supabase: actionSupabase.supabase as never,
    serviceRoleSupabase: actionSupabase.serviceRoleSupabase as never,
    userId: "user-1",
    sessionId,
  });

  return { result, ...actionSupabase };
}

describe("handleTeacherDashboardAction", () => {
  it("saves multiple student attendance states for the selected session", async () => {
    const form = new URLSearchParams({
      intent: "update-attendances",
      "attendance:student-1": "present",
      "attendance:student-2": "late",
    });
    const { result, attendanceUpserts } = await submitDashboardAction({ form });

    expect(result).toEqual({
      ok: true,
      message: "2명의 출석 상태를 저장했습니다.",
      intent: "update-attendances",
    });
    expect(attendanceUpserts).toContainEqual({
      source: "dashboard",
      table: "attendances",
      values: [
        {
          student_id: "student-1",
          lecture_session_id: "session-2",
          status: "present",
        },
        {
          student_id: "student-2",
          lecture_session_id: "session-2",
          status: "late",
        },
      ],
      options: { onConflict: "student_id,lecture_session_id" },
    });
  });

  it("rejects an invalid attendance status", async () => {
    await expect(
      submitDashboardAction({
        form: new URLSearchParams({
          intent: "update-attendances",
          "attendance:student-1": "invalid-status",
        }),
      }),
    ).rejects.toThrow("출석 상태를 다시 확인해 주세요.");
  });

  it("rejects students who are not part of the selected session", async () => {
    await expect(
      submitDashboardAction({
        form: new URLSearchParams({
          intent: "update-attendances",
          "attendance:student-3": "present",
        }),
        options: { attendanceStudentIds: ["student-1", "student-2"] },
      }),
    ).rejects.toThrow("세션에 없는 학생의 출석은 수정할 수 없습니다.");
  });

  it("creates a makeup session and seeds attendances from the source lecture enrollments", async () => {
    const { result, sessionInserts, attendanceUpserts } =
      await submitDashboardAction({
        url: "https://example.com/teacher/dashboard?date=2026-07-03",
        sessionId: undefined,
        form: new URLSearchParams({
          intent: "create-manual-session",
          kind: "makeup",
          selectedDate: "2026-07-03",
          period: "3",
          name: "Biology Makeup",
          classroomName: "Science Lab",
          sourceLectureId: "lecture-2",
          note: "교내 행사로 인한 보강",
        }),
      });

    expect(result).toEqual({
      ok: true,
      message: "보강을 등록했습니다.",
      intent: "create-manual-session",
      sessionId: "session-created",
      selectedDate: "2026-07-03",
    });
    expect(sessionInserts).toContainEqual({
      table: "lecture_sessions",
      values: {
        lecture_id: "lecture-2",
        school_id: "school-1",
        semester_id: 1,
        name: "Biology Makeup",
        module: "Science",
        session_date: "2026-07-03",
        period: 3,
        classroom_id: "classroom-1",
        teacher_id: "teacher-1",
        kind: "makeup",
        note: "교내 행사로 인한 보강",
      },
    });
    expect(attendanceUpserts).toContainEqual({
      source: "service-role",
      table: "attendances",
      values: [
        {
          student_id: "student-1",
          lecture_session_id: "session-created",
          status: "absent",
        },
        {
          student_id: "student-2",
          lecture_session_id: "session-created",
          status: "absent",
        },
      ],
      options: { onConflict: "student_id,lecture_session_id" },
    });
  });

  it("creates a special session for the selected students", async () => {
    const form = new URLSearchParams({
      intent: "create-manual-session",
      kind: "special",
      selectedDate: "2026-07-03",
      period: "5",
      name: "Guest Seminar",
      classroomName: "Science Lab",
      note: "외부 강사 초청",
    });
    form.append("studentIds", "student-1");
    form.append("studentIds", "student-3");

    const { result, sessionInserts, attendanceUpserts } =
      await submitDashboardAction({
        url: "https://example.com/teacher/dashboard?date=2026-07-03",
        sessionId: undefined,
        form,
      });

    expect(result).toEqual({
      ok: true,
      message: "특강을 등록했습니다.",
      intent: "create-manual-session",
      sessionId: "session-created",
      selectedDate: "2026-07-03",
    });
    expect(sessionInserts).toContainEqual({
      table: "lecture_sessions",
      values: {
        lecture_id: null,
        school_id: "school-1",
        semester_id: 1,
        name: "Guest Seminar",
        module: null,
        session_date: "2026-07-03",
        period: 5,
        classroom_id: "classroom-1",
        teacher_id: "teacher-1",
        kind: "special",
        note: "외부 강사 초청",
      },
    });
    expect(attendanceUpserts).toContainEqual({
      source: "service-role",
      table: "attendances",
      values: [
        {
          student_id: "student-1",
          lecture_session_id: "session-created",
          status: "absent",
        },
        {
          student_id: "student-3",
          lecture_session_id: "session-created",
          status: "absent",
        },
      ],
      options: { onConflict: "student_id,lecture_session_id" },
    });
  });

  it("rejects a special session without selected students", async () => {
    await expect(
      submitDashboardAction({
        url: "https://example.com/teacher/dashboard?date=2026-07-03",
        sessionId: undefined,
        form: new URLSearchParams({
          intent: "create-manual-session",
          kind: "special",
          selectedDate: "2026-07-03",
          period: "5",
          name: "Guest Seminar",
          classroomName: "Science Lab",
        }),
      }),
    ).rejects.toThrow("특강에 등록할 학생을 한 명 이상 선택해 주세요.");
  });

  it("rejects when the teacher already has a session in the same slot", async () => {
    await expect(
      submitDashboardAction({
        url: "https://example.com/teacher/dashboard?date=2026-07-03",
        sessionId: undefined,
        form: new URLSearchParams({
          intent: "create-manual-session",
          kind: "makeup",
          selectedDate: "2026-07-03",
          period: "3",
          name: "Biology Makeup",
          classroomName: "Science Lab",
          sourceLectureId: "lecture-2",
        }),
        options: {
          conflictingSessions: [
            {
              id: "session-conflict",
              teacher_id: "teacher-1",
              classroom_id: "classroom-9",
            },
          ],
        },
      }),
    ).rejects.toThrow("해당 날짜와 교시에는 이미 수업이 등록되어 있습니다.");
  });

  it("rejects when the typed classroom name does not match an existing one", async () => {
    await expect(
      submitDashboardAction({
        url: "https://example.com/teacher/dashboard?date=2026-07-03",
        sessionId: undefined,
        form: new URLSearchParams({
          intent: "create-manual-session",
          kind: "special",
          selectedDate: "2026-07-03",
          period: "6",
          name: "Workshop",
          classroomName: "Room B202",
          studentIds: "student-1",
        }),
        options: { classroomExists: false },
      }),
    ).rejects.toThrow("입력한 이름과 일치하는 교실이 없습니다.");
  });
});
