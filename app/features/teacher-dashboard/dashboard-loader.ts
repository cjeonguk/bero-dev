import { DateTime } from "luxon";
import { data, redirect } from "react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildTodaySchedule,
  type DashboardClassroomOption,
  resolveDashboardViewState,
  type DashboardLectureOption,
  selectLecture,
  type DashboardLecture,
  type DashboardStudentOption,
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
  classrooms: DashboardClassroomOption[];
  students: DashboardStudentOption[];
  teacherLectures: DashboardLectureOption[];
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

async function getDashboardTeacherActor({
  supabase,
  userId,
}: {
  supabase: DashboardSupabaseClient;
  userId: string;
}): Promise<{ id: string; school_id: string }> {
  const { data: teacher, error } = await supabase
    .from("teachers")
    .select("school_id, id")
    .eq("user_id", userId)
    .single();

  if (error) {
    throw new Error("account is not a teacher");
  }

  if (!teacher?.school_id) {
    throw new Error("teacher is missing school");
  }

  return {
    id: teacher.id,
    school_id: teacher.school_id,
  };
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
        note: string | null;
        classroom: {
          name: string | null;
        } | null;
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
    classroomName: session.classroom?.name ?? undefined,
    note: session.note ?? undefined,
    period: session.period,
    kind: session.kind,
  } satisfies DashboardLecture;
}

function compareStudentNumbers(leftNum: string, rightNum: string) {
  return leftNum.localeCompare(rightNum, "ko-KR", {
    numeric: true,
    sensitivity: "base",
  });
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
  const teacher = await getDashboardTeacherActor({
    supabase: dashboardSupabase,
    userId: teacherUserId,
  });
  const { now, today, selectedDate, dateLabel, weekdayLabel } =
    getSelectedDateContext(request);

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
      classrooms: [],
      students: [],
      teacherLectures: [],
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

  const [
    dailySessionsResult,
    classroomsResult,
    studentsResult,
    lecturesResult,
  ] = await Promise.all([
    dashboardSupabase
      .from("lecture_sessions")
      .select(
        "id, lecture_id, name, module, note, period, kind, classroom:classrooms!lecture_sessions_classroom_id_fkey(name)",
      )
      .eq("teacher_id", teacher.id)
      .eq("session_date", selectedDate)
      .order("period", { ascending: true }),
    dashboardSupabase
      .from("classrooms")
      .select("id, name")
      .eq("school_id", teacher.school_id)
      .order("name", { ascending: true }),
    dashboardSupabase
      .from("students")
      .select("id, name, num, status")
      .eq("school_id", teacher.school_id)
      .order("num", { ascending: true }),
    dashboardSupabase
      .from("lectures")
      .select("id, name, module, semester_id")
      .eq("teacher_id", teacher.id)
      .eq("semester_id", semester.id)
      .order("created_at", { ascending: true }),
  ]);

  if (dailySessionsResult.error) {
    throw new Error("error in retrieving lecture sessions");
  }
  if (classroomsResult.error) {
    throw new Error("error in retrieving classrooms");
  }
  if (studentsResult.error) {
    throw new Error("error in retrieving students");
  }
  if (lecturesResult.error) {
    throw new Error("error in retrieving lectures");
  }

  const classrooms = (classroomsResult.data ?? [])
    .filter((classroom): classroom is { id: string; name: string } =>
      Boolean(classroom.id && classroom.name),
    )
    .map((classroom) => ({
      id: classroom.id,
      name: classroom.name,
    })) satisfies DashboardClassroomOption[];

  const students = (studentsResult.data ?? [])
    .filter(
      (
        student,
      ): student is {
        id: string;
        name: string;
        num: string;
        status: Database["public"]["Enums"]["student_status"];
      } => Boolean(student.id && student.name && student.num),
    )
    .map((student) => ({
      id: student.id,
      name: student.name,
      num: student.num,
      status: student.status,
    })) satisfies DashboardStudentOption[];

  const teacherLectures = (lecturesResult.data ?? [])
    .filter(
      (
        lecture,
      ): lecture is {
        id: string;
        name: string;
        module: string | null;
        semester_id: number | null;
      } => Boolean(lecture.id && lecture.name),
    )
    .map((lecture) => ({
      id: lecture.id,
      name: lecture.name,
      module: lecture.module ?? undefined,
      semesterId: lecture.semester_id ?? undefined,
    })) satisfies DashboardLectureOption[];

  const schedule = buildTodaySchedule({
    sessions: (dailySessionsResult.data ?? []).map((session) => ({
      sessionId: session.id,
      lectureId: session.lecture_id,
      name: session.name,
      module: session.module,
      classroomName: session.classroom?.name ?? null,
      note: session.note,
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
    classrooms,
    students,
    teacherLectures,
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
  const teacherUserId = await getDashboardUserId({
    supabase: dashboardSupabase,
    userId,
  });
  const teacher = await getDashboardTeacherActor({
    supabase: dashboardSupabase,
    userId: teacherUserId,
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
        "id, lecture_id, semester_id, name, module, note, period, kind, session_date, teacher_id, school_id, classroom:classrooms!lecture_sessions_classroom_id_fkey(name)",
      )
      .eq("id", sessionId)
      .maybeSingle();
  if (getLectureSessionError) {
    throw new Error("error in retrieving lecture session");
  }

  const isOwnedLectureSession =
    lectureSession?.teacher_id === teacher.id &&
    lectureSession.school_id === teacher.school_id;

  const currentLecture = resolveCurrentLectureFromSession({
    session: lectureSession,
    selectedDateTime,
  });

  if (!currentLecture?.sessionId || !lectureSession || !isOwnedLectureSession) {
    return {
      currentLecture: undefined,
      students: [],
      viewState: "no-selection",
    } satisfies TeacherDashboardLectureDetailLoaderData;
  }

  const { data: attendances, error: getAttendancesError } =
    await dashboardSupabase
      .from("attendances")
      .select(
        `
      student_id,
      status,
      student:students!attendances_student_id_fkey (
        id,
        name,
        num
      )
    `,
      )
      .eq("lecture_session_id", lectureSession.id);
  if (getAttendancesError) {
    throw new Error("error in retrieving attendances");
  }

  return {
    currentLecture,
    students: (attendances ?? [])
      .filter(
        (
          attendance,
        ): attendance is {
          student_id: string;
          status: Database["public"]["Enums"]["attendance_status"];
          student: { id: string; name: string; num: string };
        } =>
          Boolean(
            attendance.student_id &&
            attendance.status &&
            attendance.student?.id &&
            attendance.student.name &&
            attendance.student.num,
          ),
      )
      .map((attendance) => ({
        id: attendance.student.id,
        name: attendance.student.name,
        num: attendance.student.num,
        attendance: attendance.status,
      }))
      .sort((left, right) => compareStudentNumbers(left.num, right.num)),
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
