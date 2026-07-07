import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { action } from "../api";
import { createServiceRoleClient } from "~/lib/supabase/server";

vi.mock("~/lib/supabase/server", () => ({
  createServiceRoleClient: vi.fn(),
}));

const mockedCreateServiceRoleClient = vi.mocked(createServiceRoleClient);

type ActionSetupOptions = {
  requestClassroom?: string;
  detectedClassroomName?: string;
  currentPeriodSchedules?: Array<{
    period: number;
    start_time: string;
    end_time: string;
  }>;
  enrollments?: Array<{ lecture_id: string }>;
  specialSessionEnrollments?: Array<{ lecture_session_id: string }>;
  currentSessions?: Array<{
    id: string;
    lecture_id: string | null;
    classroom_id: string;
    classroom: { name: string };
  }>;
};

function setupActionTest(options: ActionSetupOptions = {}) {
  const upsertAttendance = vi.fn().mockResolvedValue({ error: null });
  const updateStudentMatch = vi.fn().mockResolvedValue({ error: null });

  const studentInfo = {
    name: "Kim",
    id: "student-1",
    school: {
      id: "school-1",
      semester: {
        id: 1,
        period_schedules: options.currentPeriodSchedules ?? [
          { period: 2, start_time: "10:00:00+09", end_time: "10:50:00+09" },
        ],
      },
    },
  };

  const enrollments = options.enrollments ?? [{ lecture_id: "lecture-1" }];
  const specialSessionEnrollments = options.specialSessionEnrollments ?? [];
  const currentSessions = options.currentSessions ?? [
    {
      id: "session-1",
      lecture_id: "lecture-1",
      classroom_id: "classroom-1",
      classroom: { name: options.detectedClassroomName ?? "Room A" },
    },
  ];

  const supabase = {
    from: vi.fn((table: string) => {
      if (table === "students") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi
                .fn()
                .mockResolvedValue({ data: studentInfo, error: null }),
            })),
          })),
          update: vi.fn(() => ({
            match: updateStudentMatch,
          })),
        };
      }

      if (table === "enrollments") {
        return {
          select: vi.fn(() => ({
            match: vi
              .fn()
              .mockResolvedValue({ data: enrollments, error: null }),
          })),
        };
      }

      if (table === "lecture_session_enrollments") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({
              data: specialSessionEnrollments,
              error: null,
            }),
          })),
        };
      }

      if (table === "lecture_sessions") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn().mockResolvedValue({
                  data: currentSessions,
                  error: null,
                }),
              })),
            })),
          })),
        };
      }

      if (table === "attendances") {
        return {
          upsert: upsertAttendance,
        };
      }

      throw new Error(`unexpected table ${table}`);
    }),
  };

  mockedCreateServiceRoleClient.mockReturnValue(supabase as never);

  const request = new Request("http://localhost/api", {
    method: "POST",
    headers: {
      authorization: "Bearer test-device-token",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      deviceID: "device-1",
      rssi: -42,
      deviceName: "Beacon",
      timestamp: "2026-06-19T01:05:00.000Z",
      classroom: options.requestClassroom ?? "Room A",
    }),
  });

  return {
    request,
    upsertAttendance,
    updateStudentMatch,
  };
}

function createActionArgs(request: Request): Parameters<typeof action>[0] {
  return {
    request,
    params: {},
    context: {} as never,
    url: new URL(request.url),
    pattern: "/api",
  } as Parameters<typeof action>[0];
}

describe("api route action", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-19T01:05:00.000Z"));
    vi.stubEnv("DEVICE_API_TOKEN", "test-device-token");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("updates the student location and upserts a present attendance for the current lecture", async () => {
    const { request, upsertAttendance, updateStudentMatch } = setupActionTest();

    await expect(action(createActionArgs(request))).resolves.toEqual({
      success: true,
      studentName: "Kim",
    });

    expect(updateStudentMatch).toHaveBeenCalledWith({ id: "student-1" });
    expect(upsertAttendance).toHaveBeenCalledWith(
      {
        student_id: "student-1",
        lecture_id: "lecture-1",
        lecture_session_id: "session-1",
        attendance_date: "2026-06-19",
        period: 2,
        status: "present",
      },
      {
        onConflict: "student_id,lecture_session_id",
      },
    );
  });

  it("does not write attendance when the detected classroom does not match", async () => {
    const { request, upsertAttendance, updateStudentMatch } = setupActionTest({
      requestClassroom: "Other Room",
      detectedClassroomName: "Room A",
    });

    await expect(action(createActionArgs(request))).resolves.toEqual({
      success: false,
      studentName: "Kim",
    });

    expect(updateStudentMatch).not.toHaveBeenCalled();
    expect(upsertAttendance).not.toHaveBeenCalled();
  });

  it("writes attendance for the later period of a consecutive lecture", async () => {
    const { request, upsertAttendance, updateStudentMatch } = setupActionTest({
      currentPeriodSchedules: [
        { period: 4, start_time: "10:00:00+09", end_time: "10:50:00+09" },
      ],
      currentSessions: [
        {
          id: "session-4",
          lecture_id: "lecture-1",
          classroom_id: "classroom-1",
          classroom: { name: "Room A" },
        },
      ],
    });

    await expect(action(createActionArgs(request))).resolves.toEqual({
      success: true,
      studentName: "Kim",
    });

    expect(updateStudentMatch).toHaveBeenCalledWith({ id: "student-1" });
    expect(upsertAttendance).toHaveBeenCalledWith(
      {
        student_id: "student-1",
        lecture_id: "lecture-1",
        lecture_session_id: "session-4",
        attendance_date: "2026-06-19",
        period: 4,
        status: "present",
      },
      {
        onConflict: "student_id,lecture_session_id",
      },
    );
  });

  it("writes attendance for a standalone special session", async () => {
    const { request, upsertAttendance, updateStudentMatch } = setupActionTest({
      enrollments: [],
      specialSessionEnrollments: [{ lecture_session_id: "session-special" }],
      currentSessions: [
        {
          id: "session-special",
          lecture_id: null,
          classroom_id: "classroom-1",
          classroom: { name: "Room A" },
        },
      ],
    });

    await expect(action(createActionArgs(request))).resolves.toEqual({
      success: true,
      studentName: "Kim",
    });

    expect(updateStudentMatch).toHaveBeenCalledWith({ id: "student-1" });
    expect(upsertAttendance).toHaveBeenCalledWith(
      {
        student_id: "student-1",
        lecture_id: null,
        lecture_session_id: "session-special",
        attendance_date: "2026-06-19",
        period: 2,
        status: "present",
      },
      {
        onConflict: "student_id,lecture_session_id",
      },
    );
  });

  it("returns false and skips writes when no current period matches", async () => {
    const { request, upsertAttendance, updateStudentMatch } = setupActionTest({
      currentPeriodSchedules: [
        { period: 1, start_time: "09:00:00+09", end_time: "09:50:00+09" },
      ],
    });

    await expect(action(createActionArgs(request))).resolves.toEqual({
      success: false,
      studentName: "Kim",
    });

    expect(updateStudentMatch).not.toHaveBeenCalled();
    expect(upsertAttendance).not.toHaveBeenCalled();
  });

  it("rejects requests without the device token", async () => {
    const { request } = setupActionTest();
    const unauthorizedRequest = new Request(request, {
      headers: {
        "content-type": "application/json",
      },
    });

    const response = await action(createActionArgs(unauthorizedRequest));

    expect(response).toBeInstanceOf(Response);
    expect((response as Response).status).toBe(401);
    await expect((response as Response).json()).resolves.toEqual({
      success: false,
      studentName: "",
      error: "Unauthorized",
    });
    expect(mockedCreateServiceRoleClient).not.toHaveBeenCalled();
  });
});
