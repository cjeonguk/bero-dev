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
import {
  type LectureScheduleEntry,
  type PeriodScheduleEntry,
} from "~/utils/schedules";

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

function resolveCurrentLectureFromLecture({
  lecture,
  selectedDateTime,
  selectedPeriod,
}: {
  lecture:
    | {
        id: string;
        name: string | null;
        module: string | null;
        schedule: LectureScheduleEntry[] | null;
      }
    | null
    | undefined;
  selectedDateTime: DateTime<true> | DateTime<false>;
  selectedPeriod?: number;
}) {
  if (!lecture?.id) {
    return undefined;
  }

  const dayName = selectedDateTime.setLocale("en-US").toFormat("cccc");
  const matchingPeriod = (lecture.schedule ?? []).find(
    (entry) =>
      entry.day === dayName &&
      (selectedPeriod === undefined || entry.period === selectedPeriod),
  );

  if (!matchingPeriod) {
    return undefined;
  }

  return {
    id: lecture.id,
    name: lecture.name ?? "-",
    module: lecture.module ?? undefined,
    period: matchingPeriod.period,
  } satisfies DashboardLecture;
}

export async function loadTeacherDashboardShellData({
  request,
  lectureId,
  supabase,
  userId,
}: {
  request: Request;
  lectureId?: string;
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
  const {
    now,
    today,
    selectedDate,
    selectedDateTime,
    dateLabel,
    weekdayLabel,
  } = getSelectedDateContext(request);

  const { data: teacher, error } = await dashboardSupabase
    .from("teachers")
    .select("school_id, id")
    .eq("id", teacherUserId)
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

  const { data: semesterLectures, error: getLecturesError } =
    await dashboardSupabase
      .from("lectures")
      .select("schedule, id, name, module")
      .eq("teacher_id", teacher.id)
      .eq("semester_id", semester.id);
  if (getLecturesError) {
    throw new Error("error in retrieving lectures");
  }

  const dayName = selectedDateTime.setLocale("en-US").toFormat("cccc");
  const selectedPeriod = getSelectedPeriodFromRequest(request);
  const schedule = buildTodaySchedule({
    lectures: (semesterLectures ?? []).map((lecture) => ({
      id: lecture.id,
      name: lecture.name,
      module: lecture.module,
      schedule: (lecture.schedule ?? []) as LectureScheduleEntry[],
    })),
    dayName,
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
    selectedLectureId: lectureId,
    selectedPeriod,
  });

  return {
    schedule,
    currentLecture,
    selectedDate,
    dateLabel,
    weekdayLabel,
    viewState: resolveDashboardViewState({
      hasSemester: true,
      hasCurrentLecture: Boolean(currentLecture?.id),
      isDayFinished,
    }),
  } satisfies TeacherDashboardShellLoaderData;
}

export async function loadTeacherDashboardLectureDetailData({
  request,
  lectureId,
  supabase,
  userId,
}: {
  request: Request;
  lectureId?: string;
  supabase?: DashboardSupabaseClient;
  userId?: string;
}) {
  const detailStartedAt = Date.now();
  const selectedPeriod = getSelectedPeriodFromRequest(request);
  const selectedDate = getSelectedDateFromRequest(request);

  console.info("[dashboard:detail:start]", {
    lectureId: lectureId ?? null,
    date: selectedDate ?? null,
    period: selectedPeriod ?? null,
  });

  const dashboardSupabase = await getDashboardSupabaseClient({
    request,
    supabase,
  });

  const authStartedAt = Date.now();
  await getDashboardUserId({
    supabase: dashboardSupabase,
    userId,
  });
  console.info("[dashboard:detail:step]", {
    step: "auth.getUser",
    lectureId: lectureId ?? null,
    date: selectedDate ?? null,
    period: selectedPeriod ?? null,
    durationMs: Date.now() - authStartedAt,
  });

  const { selectedDate: resolvedSelectedDate, selectedDateTime } =
    getSelectedDateContext(request);

  if (!lectureId) {
    console.info("[dashboard:detail:end]", {
      lectureId: null,
      date: resolvedSelectedDate,
      period: selectedPeriod ?? null,
      totalDurationMs: Date.now() - detailStartedAt,
      viewState: "no-selection",
    });

    return {
      currentLecture: undefined,
      students: [],
      viewState: "no-selection",
    } satisfies TeacherDashboardLectureDetailLoaderData;
  }

  const lectureQueryStartedAt = Date.now();
  const { data: lecture, error: getLectureError } = await dashboardSupabase
    .from("lectures")
    .select("id, name, module, schedule")
    .eq("id", lectureId)
    .maybeSingle();
  console.info("[dashboard:detail:query]", {
    query: "lecture",
    lectureId,
    date: resolvedSelectedDate,
    period: selectedPeriod ?? null,
    durationMs: Date.now() - lectureQueryStartedAt,
    rowCount: lecture ? 1 : 0,
  });
  if (getLectureError) {
    throw new Error("error in retrieving lecture");
  }

  const currentLecture = resolveCurrentLectureFromLecture({
    lecture: lecture
      ? {
          ...lecture,
          schedule: (lecture.schedule ?? []) as LectureScheduleEntry[],
        }
      : lecture,
    selectedDateTime,
    selectedPeriod,
  });

  if (!currentLecture?.id) {
    console.info("[dashboard:detail:end]", {
      lectureId,
      date: resolvedSelectedDate,
      period: selectedPeriod ?? null,
      totalDurationMs: Date.now() - detailStartedAt,
      viewState: "no-selection",
    });

    return {
      currentLecture: undefined,
      students: [],
      viewState: "no-selection",
    } satisfies TeacherDashboardLectureDetailLoaderData;
  }

  const parallelQueriesStartedAt = Date.now();
  const [enrollmentsResult, attendancesResult] = await Promise.all([
    (async () => {
      const enrollmentsStartedAt = Date.now();
      const result = await dashboardSupabase
        .from("enrollments")
        .select(
          `
      student:student_id (
      id,
      name,
      num
      )`,
        )
        .eq("lecture_id", currentLecture.id);

      console.info("[dashboard:detail:query]", {
        query: "enrollments",
        lectureId: currentLecture.id,
        date: resolvedSelectedDate,
        period: currentLecture.period,
        durationMs: Date.now() - enrollmentsStartedAt,
        rowCount: result.data?.length ?? 0,
      });

      return result;
    })(),
    (async () => {
      const attendancesStartedAt = Date.now();
      const result = await dashboardSupabase
        .from("attendances")
        .select("student_id, status")
        .eq("lecture_id", currentLecture.id)
        .eq("attendance_date", resolvedSelectedDate)
        .eq("period", currentLecture.period);

      console.info("[dashboard:detail:query]", {
        query: "attendances",
        lectureId: currentLecture.id,
        date: resolvedSelectedDate,
        period: currentLecture.period,
        durationMs: Date.now() - attendancesStartedAt,
        rowCount: result.data?.length ?? 0,
      });

      return result;
    })(),
  ]);
  console.info("[dashboard:detail:step]", {
    step: "parallelQueries",
    lectureId: currentLecture.id,
    date: resolvedSelectedDate,
    period: currentLecture.period,
    durationMs: Date.now() - parallelQueriesStartedAt,
  });

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

  const mergeStartedAt = Date.now();
  const mergedStudents = mergeStudentsWithAttendances({
    students,
    attendances: attendances ?? [],
  });
  console.info("[dashboard:detail:step]", {
    step: "mergeStudentsWithAttendances",
    lectureId: currentLecture.id,
    date: resolvedSelectedDate,
    period: currentLecture.period,
    durationMs: Date.now() - mergeStartedAt,
    studentCount: mergedStudents.length,
  });

  console.info("[dashboard:detail:end]", {
    lectureId: currentLecture.id,
    date: resolvedSelectedDate,
    period: currentLecture.period,
    totalDurationMs: Date.now() - detailStartedAt,
    viewState: "active-lecture",
    studentCount: mergedStudents.length,
  });

  return {
    currentLecture,
    students: mergedStudents,
    viewState: "active-lecture",
  } satisfies TeacherDashboardLectureDetailLoaderData;
}

export async function loadTeacherDashboardShell({
  request,
  lectureId,
}: {
  request: Request;
  lectureId?: string;
}) {
  const startedAt = Date.now();
  const { supabase, headers } = createClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return redirect("/login", { headers });
  }

  try {
    return data(
      await loadTeacherDashboardShellData({
        request,
        lectureId,
        supabase,
        userId: user.id,
      }),
      { headers },
    );
  } finally {
    console.info("[dashboard:shell]", {
      lectureId: lectureId ?? null,
      date: getSelectedDateFromRequest(request) ?? null,
      durationMs: Date.now() - startedAt,
    });
  }
}

export async function loadTeacherDashboardLectureDetail({
  request,
  lectureId,
}: {
  request: Request;
  lectureId?: string;
}) {
  const startedAt = Date.now();
  const { supabase, headers } = createClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return redirect("/login", { headers });
  }

  try {
    return data(
      await loadTeacherDashboardLectureDetailData({
        request,
        lectureId,
        supabase,
        userId: user.id,
      }),
      { headers },
    );
  } finally {
    console.info("[dashboard:detail]", {
      lectureId: lectureId ?? null,
      date: getSelectedDateFromRequest(request) ?? null,
      period: getSelectedPeriodFromRequest(request) ?? null,
      durationMs: Date.now() - startedAt,
    });
  }
}
