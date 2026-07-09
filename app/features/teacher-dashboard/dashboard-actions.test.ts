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
};

function createDashboardActionSupabase(
  options: DashboardActionSupabaseOptions = {},
) {
  const upserts: Array<{ table: string; values: unknown; options?: unknown }> =
    [];
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
            upserts.push({ table, values, options: upsertOptions });
            return Promise.resolve({ error: null });
          }),
        };
      }

      throw new Error(`unexpected table ${table}`);
    }),
  };

  return { supabase, upserts };
}

async function submitDashboardAction(
  form: Record<string, string>,
  options: DashboardActionSupabaseOptions = {},
) {
  const request = new Request(
    "https://example.com/teacher/dashboard/session-2",
    {
      method: "POST",
      body: new URLSearchParams(form),
    },
  );
  const actionSupabase = createDashboardActionSupabase(options);
  const result = await handleTeacherDashboardAction({
    request,
    supabase: actionSupabase.supabase as never,
    userId: "user-1",
    sessionId: "session-2",
  });

  return { result, ...actionSupabase };
}

describe("handleTeacherDashboardAction", () => {
  it("saves multiple student attendance states for the selected session", async () => {
    const { result, upserts } = await submitDashboardAction({
      intent: "update-attendances",
      "attendance:student-1": "present",
      "attendance:student-2": "late",
    });

    expect(result).toEqual({
      ok: true,
      message: "2명의 출석 상태를 저장했습니다.",
      intent: "update-attendances",
    });
    expect(upserts).toContainEqual({
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
        intent: "update-attendances",
        "attendance:student-1": "invalid-status",
      }),
    ).rejects.toThrow("출석 상태를 다시 확인해 주세요.");
  });

  it("rejects students who are not part of the selected session", async () => {
    await expect(
      submitDashboardAction(
        {
          intent: "update-attendances",
          "attendance:student-3": "present",
        },
        { attendanceStudentIds: ["student-1", "student-2"] },
      ),
    ).rejects.toThrow("세션에 없는 학생의 출석은 수정할 수 없습니다.");
  });
});
