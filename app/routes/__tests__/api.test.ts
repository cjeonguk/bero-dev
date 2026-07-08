import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { action } from "../api";
import { createServiceRoleClient } from "~/lib/supabase/server";

vi.mock("~/lib/supabase/server", () => ({
  createServiceRoleClient: vi.fn(),
}));

const mockedCreateServiceRoleClient = vi.mocked(createServiceRoleClient);
const testClientId = "attendance-client-1";
const testToken = "test-device-token";
const testTokenHash =
  "fdc2f4194f79710d879d596f606d94f5e85f07f53b42d2b13f2e9aeb74d78c39";

type ActionSetupOptions = {
  currentPeriodSchedules?: Array<{
    period: number;
    start_time: string;
    end_time: string;
  }>;
  enrollments?: Array<{ lecture_id: string }>;
  currentSessionAttendances?: Array<{ lecture_session_id: string }>;
  currentSessions?: Array<{
    id: string;
    lecture_id: string | null;
    classroom_id: string;
    teacher_id?: string;
  }>;
  attendanceClient?: {
    id: string;
    school_id: string;
    token_hash: string;
    active: boolean;
    default_classroom_id: string | null;
    owner_teacher_id: string | null;
  } | null;
  requestClientId?: string;
};

function setupActionTest(options: ActionSetupOptions = {}) {
  const upsertAttendance = vi.fn().mockResolvedValue({ error: null });
  const updateStudentMatch = vi.fn().mockResolvedValue({ error: null });
  const updateAttendanceClientMatch = vi
    .fn()
    .mockResolvedValue({ error: null });

  const attendanceClient = options.attendanceClient ?? {
    id: testClientId,
    school_id: "school-1",
    token_hash: testTokenHash,
    active: true,
    default_classroom_id: "classroom-1",
    owner_teacher_id: null,
  };

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
  const currentSessionAttendances = options.currentSessionAttendances ?? [];
  const currentSessions = options.currentSessions ?? [
    {
      id: "session-1",
      lecture_id: "lecture-1",
      classroom_id: "classroom-1",
      teacher_id: "teacher-1",
    },
  ];

  const supabase = {
    from: vi.fn((table: string) => {
      if (table === "attendance_clients") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi
                .fn()
                .mockResolvedValue({ data: attendanceClient, error: null }),
            })),
          })),
          update: vi.fn(() => ({
            match: updateAttendanceClientMatch,
          })),
        };
      }

      if (table === "students") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi
                  .fn()
                  .mockResolvedValue({ data: studentInfo, error: null }),
              })),
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
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              in: vi.fn().mockResolvedValue({
                data: currentSessionAttendances,
                error: null,
              }),
            })),
          })),
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
      authorization: `Bearer ${testToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      clientId: options.requestClientId ?? testClientId,
      deviceID: "device-1",
      rssi: -42,
      deviceName: "Beacon",
      timestamp: "2026-06-19T01:05:00.000Z",
    }),
  });

  return {
    request,
    upsertAttendance,
    updateStudentMatch,
    updateAttendanceClientMatch,
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
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("updates the student location and upserts a present attendance for the current lecture", async () => {
    const {
      request,
      upsertAttendance,
      updateStudentMatch,
      updateAttendanceClientMatch,
    } = setupActionTest();

    await expect(action(createActionArgs(request))).resolves.toEqual({
      success: true,
      studentName: "Kim",
    });

    expect(updateStudentMatch).toHaveBeenCalledWith({ id: "student-1" });
    expect(updateAttendanceClientMatch).toHaveBeenCalledWith({
      id: testClientId,
    });
    expect(upsertAttendance).toHaveBeenCalledWith(
      {
        student_id: "student-1",
        lecture_session_id: "session-1",
        status: "present",
      },
      {
        onConflict: "student_id,lecture_session_id",
      },
    );
  });

  it("does not write attendance when the client does not resolve to a current session", async () => {
    const { request, upsertAttendance, updateStudentMatch } = setupActionTest({
      attendanceClient: {
        id: testClientId,
        school_id: "school-1",
        token_hash: testTokenHash,
        active: true,
        default_classroom_id: "classroom-2",
        owner_teacher_id: null,
      },
    });

    await expect(action(createActionArgs(request))).resolves.toEqual({
      success: false,
      studentName: "Kim",
    });

    expect(updateStudentMatch).not.toHaveBeenCalled();
    expect(upsertAttendance).not.toHaveBeenCalled();
  });

  it("infers the current session from owner_teacher_id without a default classroom", async () => {
    const { request, upsertAttendance, updateStudentMatch } = setupActionTest({
      attendanceClient: {
        id: testClientId,
        school_id: "school-1",
        token_hash: testTokenHash,
        active: true,
        default_classroom_id: null,
        owner_teacher_id: "teacher-1",
      },
      currentSessions: [
        {
          id: "session-1",
          lecture_id: "lecture-1",
          classroom_id: "classroom-99",
          teacher_id: "teacher-1",
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
        lecture_session_id: "session-1",
        status: "present",
      },
      {
        onConflict: "student_id,lecture_session_id",
      },
    );
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
          teacher_id: "teacher-1",
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
        lecture_session_id: "session-4",
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
      currentSessionAttendances: [{ lecture_session_id: "session-special" }],
      currentSessions: [
        {
          id: "session-special",
          lecture_id: null,
          classroom_id: "classroom-1",
          teacher_id: "teacher-1",
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
        lecture_session_id: "session-special",
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
  });

  it("rejects requests when the client token does not match", async () => {
    const { request } = setupActionTest({
      attendanceClient: {
        id: testClientId,
        school_id: "school-1",
        token_hash: "not-the-right-hash",
        active: true,
        default_classroom_id: "classroom-1",
        owner_teacher_id: null,
      },
    });

    const response = await action(createActionArgs(request));

    expect(response).toBeInstanceOf(Response);
    expect((response as Response).status).toBe(401);
    await expect((response as Response).json()).resolves.toEqual({
      success: false,
      studentName: "",
      error: "Unauthorized",
    });
  });

  it("rejects inactive clients", async () => {
    const { request } = setupActionTest({
      attendanceClient: {
        id: testClientId,
        school_id: "school-1",
        token_hash: testTokenHash,
        active: false,
        default_classroom_id: "classroom-1",
        owner_teacher_id: null,
      },
    });

    const response = await action(createActionArgs(request));

    expect(response).toBeInstanceOf(Response);
    expect((response as Response).status).toBe(403);
    await expect((response as Response).json()).resolves.toEqual({
      success: false,
      studentName: "",
      error: "Client is inactive",
    });
  });
});
