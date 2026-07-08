import { describe, expect, it, vi } from "vitest";

import { loadTeacherSettingsData } from "./settings-loader";

function createLoaderSupabase({ isAdmin = true }: { isAdmin?: boolean } = {}) {
  return {
    from: vi.fn((table: string) => {
      if (table === "teachers") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "teacher-row-1",
                  school_id: "school-1",
                  name: "Teacher Bravo",
                  is_admin: isAdmin,
                },
                error: null,
              }),
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "teacher-row-1",
                    user_id: "user-1",
                    name: "Teacher Bravo",
                    is_admin: true,
                  },
                ],
                error: null,
              }),
            })),
          })),
        };
      }

      if (table === "lectures") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "lecture-1",
                    name: "Applied Science",
                    module: "SCI-1",
                    classroom_id: "classroom-1",
                    semester_id: 2,
                    schedule: [{ day: "Monday", period: 3 }],
                    holiday: [],
                  },
                ],
                error: null,
              }),
            })),
          })),
        };
      }

      if (table === "enrollments") {
        return {
          select: vi.fn(() => ({
            in: vi.fn().mockResolvedValue({
              data: [
                {
                  lecture_id: "lecture-1",
                  student: {
                    id: "student-1",
                    name: "Kim",
                    num: "1",
                    status: "active",
                  },
                },
              ],
              error: null,
            }),
          })),
        };
      }

      if (table === "students") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "student-1",
                    name: "Kim",
                    num: "1",
                    status: "active",
                    device_id: "device-1",
                    last_detected_place: null,
                  },
                ],
                error: null,
              }),
            })),
          })),
        };
      }

      if (table === "classrooms") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({
                data: [{ id: "classroom-1", name: "Room A" }],
                error: null,
              }),
            })),
          })),
        };
      }

      if (table === "semester_schedules") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({
                data: [{ id: 2, name: "2026 Term 1" }],
                error: null,
              }),
            })),
          })),
        };
      }

      if (table === "attendance_clients") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((column: string) => ({
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: column === "school_id" ? "client-2" : "client-1",
                    name:
                      column === "school_id"
                        ? "Front Desk Tablet"
                        : "Teacher Laptop",
                    active: true,
                    default_classroom_id: null,
                    classroom: null,
                    owner_teacher_id:
                      column === "school_id" ? null : "teacher-row-1",
                    last_seen_at: null,
                    ...(column === "school_id"
                      ? {
                          default_classroom_id: "classroom-1",
                          classroom: { name: "Room A" },
                        }
                      : {}),
                  },
                ],
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
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "session-1",
                    name: "Applied Science",
                    session_date: "2026-07-08",
                    period: 3,
                  },
                ],
                error: null,
              }),
            })),
          })),
        };
      }

      throw new Error(`unexpected table ${table}`);
    }),
  };
}

describe("loadTeacherSettingsData", () => {
  it("loads the signed-in teacher settings data", async () => {
    const supabase = createLoaderSupabase({ isAdmin: false });

    await expect(
      loadTeacherSettingsData({
        supabase: supabase as never,
        userId: "user-1",
        email: "teacher@example.com",
      }),
    ).resolves.toMatchObject({
      account: {
        email: "teacher@example.com",
        teacherId: "teacher-row-1",
        name: "Teacher Bravo",
        isAdmin: false,
        schoolId: "school-1",
      },
      lectures: [
        {
          id: "lecture-1",
          students: [{ id: "student-1", name: "Kim", num: "1" }],
        },
      ],
      students: [
        {
          id: "student-1",
          status: "active",
        },
      ],
      myClients: [{ id: "client-1", name: "Teacher Laptop" }],
      admin: null,
    });
  });

  it("includes school admin datasets for admin teachers", async () => {
    const supabase = createLoaderSupabase({ isAdmin: true });

    await expect(
      loadTeacherSettingsData({
        supabase: supabase as never,
        userId: "user-1",
        email: "teacher@example.com",
      }),
    ).resolves.toMatchObject({
      admin: {
        clients: [{ id: "client-2" }],
        students: [{ id: "student-1" }],
        teachers: [{ id: "teacher-row-1", userId: "user-1" }],
      },
    });
  });
});
