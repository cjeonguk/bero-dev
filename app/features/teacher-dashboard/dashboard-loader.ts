import { DateTime } from "luxon";
import { data, redirect } from "react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildTodaySchedule,
  mergeStudentsWithAttendances,
  resolveDashboardViewState,
  selectLecture,
  type DashboardLecture,
  type DashboardStudentAttendance,
  type DashboardViewState,
} from "~/features/teacher-dashboard/dashboard";
import { createClient } from "~/lib/supabase/server";
import type { Database } from "~/types/database.types";
import { timetzToMinutes } from "~/utils/dates";
import { type PeriodScheduleEntry } from "~/utils/schedules";

type DashboardSupabaseClient = SupabaseClient<Database>;

export type TeacherDashboardShellLoaderData = {
  schedule: DashboardLecture[];
  currentLecture: DashboardLecture | undefined;
  selectedDate: string;
  dateLabel: string;
  weekdayLabel: string;
  viewState: DashboardViewState;
};

export type TeacherDashboardLectureDetailLoaderData = {
  currentLecture: DashboardLecture | undefined;
  students: DashboardStudentAttendance[];
  viewState: DashboardViewState;
};

export function getSelectedPeriodFromRequest(request: Request) {
  const period = Number(new URL(request.url).searchParams.get("period"));

  return Number.isInteger(period) && period > 0 ? period : undefined;
}

export function getSelectedDateFromRequest(request: Request) {
  const date = new URL(request.url).searchParams.get("date");

  if (!date) {
    return undefined;
  }

  const selectedDate = DateTime.fromISO(date, { zone: "Asia/Seoul" });

  return selectedDate.isValid ? selectedDate.toFormat("yyyy-MM-dd") : undefined;
}

async function getDashboardSupabaseClient({
  request,
  supabase,
}: {
  request: Request;
  supabase?: DashboardSupabaseClient;
}) {
  if (supabase) {
    return supabase;
  }

  return createClient(request).supabase;
}

async function getDashboardUserId({
  supabase,
  userId,
}: {
  supabase: DashboardSupabaseClient;
  userId?: string;
}) {
  if (userId) {
    return userId;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("unauthenticated dashboard request");
  }

  return user.id;
}

function getSelectedDateContext(request: Request) {
  const now = DateTime.now().setZone("Asia/Seoul");
  const today = now.toFormat("yyyy-MM-dd");
  const selectedDate = getSelectedDateFromRequest(request) ?? today;
  const selectedDateTime = DateTime.fromISO(selectedDate, {
    zone: "Asia/Seoul",
  });

  return {
    now,
    today,
    selectedDate,
    selectedDateTime,
    dateLabel: selectedDateTime.setLocale("ko-KR").toFormat("yyyy/MM/dd"),
    weekdayLabel: selectedDateTime.setLocale("ko-KR").toFormat("ccc"),
  };
}

function resolveCurrentLectureFromSession({
  session,
  selectedDateTime,
}: {
  session:
    | {
        id: string;
        lecture_id: string | null;
        name: string | null;
        module: string | null;
        period: number;
        kind: Database["public"]["Enums"]["lecture_session_kind"];
        session_date: string;
      }
    | null
    | undefined;
  selectedDateTime: DateTime<true> | DateTime<false>;
}) {
  if (
    !session?.id ||
    session.session_date !== selectedDateTime.toFormat("yyyy-MM-dd")
  ) {
    return undefined;
  }

  return {
    sessionId: session.id,
    lectureId: session.lecture_id,
    name: session.name ?? "-",
    module: session.module ?? undefined,
    period: session.period,
    kind: session.kind,
  } satisfies DashboardLecture;
}

export async function loadTeacherDashboardShellData({
  request,
  sessionId,
  supabase,
  userId,
}: {
  request: Request;
  sessionId?: string;
  supabase?: DashboardSupabaseClient;
  userId?: string;
}) {
  const dashboardSupabase = await getDashboardSupabaseClient({
    request,
    supabase,
  });
  const teacherUserId = await getDashboardUserId({
    supabase: dashboardSupabase,
    userId,
  });
  const { now, today, selectedDate, dateLabel, weekdayLabel } =
    getSelectedDateContext(request);

  const { data: teacher, error } = await dashboardSupabase
    .from("teachers")
    .select("school_id, id")
    .eq("user_id", teacherUserId)
    .single();
  if (error) {
    throw new Error("account is not a teacher");
  }

  if (!teacher?.school_id) {
    throw new Error("teacher is missing school");
  }

  const { data: semester, error: getSemesterError } = await dashboardSupabase
    .from("semester_schedules")
    .select("id, start_period, end_period, period_schedules")
    .eq("school_id", teacher.school_id)
    .lte("start_date", selectedDate)
    .gte("end_date", selectedDate)
    .maybeSingle();
  if (getSemesterError) {
    throw new Error("error in retrieving semesters");
  }

  if (!semester) {
    return {
      schedule: [],
      currentLecture: undefined,
      selectedDate,
      dateLabel,
      weekdayLabel,
      viewState: "no-semester",
    } satisfies TeacherDashboardShellLoaderData;
  }

  if (
    semester.start_period === null ||
    semester.end_period === null ||
    semester.id === null
  ) {
    throw new Error("semester schedule is incomplete");
  }

  const { data: dailySessions, error: getSessionsError } =
    await dashboardSupabase
      .from("lecture_sessions")
      .select("id, lecture_id, name, module, period, kind")
      .eq("teacher_id", teacher.id)
      .eq("session_date", selectedDate)
      .order("period", { ascending: true });
  if (getSessionsError) {
    throw new Error("error in retrieving lecture sessions");
  }

  const schedule = buildTodaySchedule({
    sessions: (dailySessions ?? []).map((session) => ({
      sessionId: session.id,
      lectureId: session.lecture_id,
      name: session.name,
      module: session.module,
      period: session.period,
      kind: session.kind,
    })),
    startPeriod: semester.start_period,
    endPeriod: semester.end_period,
  });

  const nowMinutes = now.hour * 60 + now.minute;
  const periodSchedules = (semester.period_schedules ??
    []) as PeriodScheduleEntry[];
  const lastPeriodEndMinutes = periodSchedules.reduce((latest, schedule) => {
    return Math.max(latest, timetzToMinutes(schedule.end_time));
  }, -1);
  const isDayFinished =
    selectedDate === today &&
    lastPeriodEndMinutes !== -1 &&
    nowMinutes >= lastPeriodEndMinutes;
  const currentLecture = selectLecture({
    schedule,
    selectedSessionId: sessionId,
  });

  return {
    schedule,
    currentLecture,
    selectedDate,
    dateLabel,
    weekdayLabel,
    viewState: resolveDashboardViewState({
      hasSemester: true,
      hasCurrentLecture: Boolean(currentLecture?.sessionId),
      isDayFinished,
    }),
  } satisfies TeacherDashboardShellLoaderData;
}

export async function loadTeacherDashboardLectureDetailData({
  request,
  sessionId,
  supabase,
  userId,
}: {
  request: Request;
  sessionId?: string;
  supabase?: DashboardSupabaseClient;
  userId?: string;
}) {
  const dashboardSupabase = await getDashboardSupabaseClient({
    request,
    supabase,
  });
  await getDashboardUserId({
    supabase: dashboardSupabase,
    userId,
  });

  const { selectedDateTime } = getSelectedDateContext(request);
  if (!sessionId) {
    return {
      currentLecture: undefined,
      students: [],
      viewState: "no-selection",
    } satisfies TeacherDashboardLectureDetailLoaderData;
  }

  const { data: lectureSession, error: getLectureSessionError } =
    await dashboardSupabase
      .from("lecture_sessions")
      .select(
        "id, lecture_id, semester_id, name, module, period, kind, session_date",
      )
      .eq("id", sessionId)
      .maybeSingle();
  if (getLectureSessionError) {
    throw new Error("error in retrieving lecture session");
  }

  const currentLecture = resolveCurrentLectureFromSession({
    session: lectureSession,
    selectedDateTime,
  });

  if (!currentLecture?.sessionId || !lectureSession) {
    return {
      currentLecture: undefined,
      students: [],
      viewState: "no-selection",
    } satisfies TeacherDashboardLectureDetailLoaderData;
  }

  const enrollmentQuery = lectureSession.lecture_id
    ? dashboardSupabase
        .from("enrollments")
        .select(
          `
        student:student_id (
        id,
        name,
        num
        )`,
        )
        .eq("lecture_id", lectureSession.lecture_id)
    : dashboardSupabase
        .from("lecture_session_enrollments")
        .select(
          `
        student:student_id (
        id,
        name,
        num
        )`,
        )
        .eq("lecture_session_id", lectureSession.id);

  const [enrollmentsResult, attendancesResult] = await Promise.all([
    enrollmentQuery,
    dashboardSupabase
      .from("attendances")
      .select("student_id, status")
      .eq("lecture_session_id", lectureSession.id),
  ]);

  const { data: enrollments, error: getEnrollmentsError } = enrollmentsResult;
  if (getEnrollmentsError) {
    throw new Error("error in retrieving enrollments");
  }

  const students = (enrollments ?? [])
    .map(({ student }) => student)
    .filter((student): student is { id: string; name: string; num: string } =>
      Boolean(student?.id && student.name && student.num),
    );

  const { data: attendances, error: getAttendancesError } = attendancesResult;
  if (getAttendancesError) {
    throw new Error("error in retrieving attendances");
  }

  return {
    currentLecture,
    students: mergeStudentsWithAttendances({
      students,
      attendances: attendances ?? [],
    }),
    viewState: "active-lecture",
  } satisfies TeacherDashboardLectureDetailLoaderData;
}

export async function loadTeacherDashboardShell({
  request,
  sessionId,
}: {
  request: Request;
  sessionId?: string;
}) {
  const { supabase, headers } = createClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return redirect("/login", { headers });
  }

  return data(
    await loadTeacherDashboardShellData({
      request,
      sessionId,
      supabase,
      userId: user.id,
    }),
    { headers },
  );
}

export async function loadTeacherDashboardLectureDetail({
  request,
  sessionId,
}: {
  request: Request;
  sessionId?: string;
}) {
  const { supabase, headers } = createClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return redirect("/login", { headers });
  }

  return data(
    await loadTeacherDashboardLectureDetailData({
      request,
      sessionId,
      supabase,
      userId: user.id,
    }),
    { headers },
  );
}
