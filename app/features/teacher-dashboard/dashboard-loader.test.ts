import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getSelectedDateFromRequest,
  getSelectedPeriodFromRequest,
  loadTeacherDashboardLectureDetailData,
  loadTeacherDashboardShellData,
} from "./dashboard-loader";
import { createClient } from "~/lib/supabase/server";

vi.mock("~/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const mockedCreateClient = vi.mocked(createClient);

function createRequest(
  url = "https://example.com/teacher/dashboard/session-2?date=2026-07-03&period=4",
) {
  return new Request(url);
}

function createAuthClient() {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: "teacher-1",
            email: "teacher@example.com",
          },
        },
      }),
    },
  };
}

function setupShellClient() {
  const authClient = createAuthClient();

  const supabase = {
    ...authClient,
    from: vi.fn((table: string) => {
      if (table === "teachers") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: { id: "teacher-1", school_id: "school-1" },
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
              lte: vi.fn(() => ({
                gte: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: 1,
                      start_period: 1,
                      end_period: 4,
                      period_schedules: [
                        {
                          period: 1,
                          start_time: "09:00:00+09",
                          end_time: "09:50:00+09",
                        },
                        {
                          period: 4,
                          start_time: "12:00:00+09",
                          end_time: "12:50:00+09",
                        },
                      ],
                    },
                    error: null,
                  }),
                })),
              })),
            })),
          })),
        };
      }

      if (table === "lecture_sessions") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn().mockResolvedValue({
                  data: [
                    {
                      id: "session-2",
                      lecture_id: "lecture-2",
                      name: "Biology",
                      module: "Science",
                      period: 4,
                      kind: "regular",
                    },
                  ],
                  error: null,
                }),
              })),
            })),
          })),
        };
      }

      throw new Error(`unexpected table ${table}`);
    }),
  };

  mockedCreateClient.mockReturnValue({
    supabase: supabase as never,
    headers: new Headers(),
  });

  return { supabase };
}

function setupDetailClient() {
  const authClient = createAuthClient();

  const supabase = {
    ...authClient,
    from: vi.fn((table: string) => {
      if (table === "lecture_sessions") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: "session-2",
                  lecture_id: "lecture-2",
                  semester_id: 1,
                  name: "Biology",
                  module: "Science",
                  period: 4,
                  kind: "regular",
                  session_date: "2026-07-03",
                },
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
              data: [
                {
                  student_id: "student-1",
                  status: "absent",
                  student: { id: "student-1", name: "Kim", num: "1" },
                },
                {
                  student_id: "student-2",
                  status: "present",
                  student: { id: "student-2", name: "Lee", num: "2" },
                },
              ],
              error: null,
            }),
          })),
        };
      }

      throw new Error(`unexpected table ${table}`);
    }),
  };

  mockedCreateClient.mockReturnValue({
    supabase: supabase as never,
    headers: new Headers(),
  });
}

function setupSpecialDetailClient() {
  const authClient = createAuthClient();

  const supabase = {
    ...authClient,
    from: vi.fn((table: string) => {
      if (table === "lecture_sessions") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: "session-special",
                  lecture_id: null,
                  semester_id: null,
                  name: "Guest Talk",
                  module: null,
                  period: 2,
                  kind: "special",
                  session_date: "2026-07-03",
                },
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
              data: [
                {
                  student_id: "student-3",
                  status: "absent",
                  student: { id: "student-3", name: "Park", num: "3" },
                },
              ],
              error: null,
            }),
          })),
        };
      }

      throw new Error(`unexpected table ${table}`);
    }),
  };

  mockedCreateClient.mockReturnValue({
    supabase: supabase as never,
    headers: new Headers(),
  });
}

describe("teacher dashboard loader helpers", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("reads the selected period from the dashboard URL", () => {
    const request = createRequest();

    expect(getSelectedPeriodFromRequest(request)).toBe(4);
  });

  it("reads the selected date from the dashboard URL", () => {
    const request = createRequest();

    expect(getSelectedDateFromRequest(request)).toBe("2026-07-03");
  });

  it("ignores an invalid selected date", () => {
    const request = createRequest(
      "https://example.com/teacher/dashboard/lecture-2?date=not-a-date&period=4",
    );

    expect(getSelectedDateFromRequest(request)).toBeUndefined();
  });

  it("loads shell data without fetching lecture detail rows", async () => {
    const { supabase } = setupShellClient();

    await expect(
      loadTeacherDashboardShellData({
        request: createRequest(),
        sessionId: "session-2",
      }),
    ).resolves.toMatchObject({
      selectedDate: "2026-07-03",
      dateLabel: "2026/07/03",
      weekdayLabel: "금",
      currentLecture: {
        sessionId: "session-2",
        lectureId: "lecture-2",
        period: 4,
      },
      viewState: "active-lecture",
      schedule: [
        { period: 1, name: "-" },
        { period: 2, name: "-" },
        { period: 3, name: "-" },
        {
          sessionId: "session-2",
          lectureId: "lecture-2",
          name: "Biology",
          module: "Science",
          period: 4,
          kind: "regular",
        },
      ],
    });

    expect(supabase.from).toHaveBeenCalledWith("teachers");
    expect(supabase.from).toHaveBeenCalledWith("semester_schedules");
    expect(supabase.from).toHaveBeenCalledWith("lecture_sessions");
    expect(supabase.from).not.toHaveBeenCalledWith("attendances");
  });

  it("loads lecture detail rows for the selected lecture from attendances", async () => {
    setupDetailClient();

    await expect(
      loadTeacherDashboardLectureDetailData({
        request: createRequest(),
        sessionId: "session-2",
      }),
    ).resolves.toMatchObject({
      currentLecture: {
        sessionId: "session-2",
        lectureId: "lecture-2",
        name: "Biology",
        module: "Science",
        period: 4,
      },
      students: [
        { id: "student-1", name: "Kim", num: "1", attendance: "absent" },
        { id: "student-2", name: "Lee", num: "2", attendance: "present" },
      ],
      viewState: "active-lecture",
    });
  });

  it("loads a standalone special session from attendances", async () => {
    setupSpecialDetailClient();

    await expect(
      loadTeacherDashboardLectureDetailData({
        request: createRequest(
          "https://example.com/teacher/dashboard/session-special?date=2026-07-03",
        ),
        sessionId: "session-special",
      }),
    ).resolves.toMatchObject({
      currentLecture: {
        sessionId: "session-special",
        lectureId: null,
        name: "Guest Talk",
        period: 2,
        kind: "special",
      },
      students: [
        { id: "student-3", name: "Park", num: "3", attendance: "absent" },
      ],
      viewState: "active-lecture",
    });
  });
});
