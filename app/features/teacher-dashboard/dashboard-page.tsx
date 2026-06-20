import { DateTime } from "luxon";
import { data, redirect } from "react-router";
import { ScheduleSidebar } from "~/components/teacher-dashboard/schedule-sidebar";
import { LectureAttendancePanel } from "~/components/teacher-dashboard/lecture-attendance-panel";
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
import { timetzToMinutes } from "~/utils/dates";
import {
  getCurrentPeriod,
  type LectureScheduleEntry,
  type PeriodScheduleEntry,
} from "~/utils/schedules";

export type TeacherDashboardLoaderData = {
  schedule: DashboardLecture[];
  currentLecture: DashboardLecture | undefined;
  students: DashboardStudentAttendance[];
  currentPeriod: number | undefined;
  dateLabel: string;
  weekdayLabel: string;
  viewState: DashboardViewState;
};

export async function loadTeacherDashboard({
  request,
  lectureId,
}: {
  request: Request;
  lectureId?: string;
}) {
  const { supabase, headers } = createClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return redirect("/login", { headers });
  }

  const now = DateTime.now().setZone("Asia/Seoul");
  const today = now.toFormat("yyyy-MM-dd");
  const dateLabel = now.setLocale("ko-KR").toFormat("yyyy/MM/dd");
  const weekdayLabel = now.setLocale("ko-KR").toFormat("ccc");

  const { data: teacher, error } = await supabase
    .from("teachers")
    .select("school_id, id")
    .eq("id", user.id)
    .single();
  if (error) {
    throw new Error("account is not a teacher");
  }

  if (!teacher?.school_id) {
    throw new Error("teacher is missing school");
  }

  const { data: semester, error: getSemesterError } = await supabase
    .from("semester_schedules")
    .select("id, start_period, end_period, period_schedules")
    .eq("school_id", teacher.school_id)
    .lte("start_date", today)
    .gte("end_date", today)
    .maybeSingle();
  if (getSemesterError) {
    throw new Error("error in retrieving semesters");
  }

  if (!semester) {
    return data<TeacherDashboardLoaderData>(
      {
        schedule: [],
        currentLecture: undefined,
        students: [],
        currentPeriod: undefined,
        dateLabel,
        weekdayLabel,
        viewState: "no-semester",
      },
      { headers },
    );
  }

  if (
    semester.start_period === null ||
    semester.end_period === null ||
    semester.id === null
  ) {
    throw new Error("semester schedule is incomplete");
  }

  const { data: semesterLectures, error: getLecturesError } = await supabase
    .from("lectures")
    .select("schedule, id, name, module")
    .eq("teacher_id", teacher.id)
    .eq("semester_id", semester.id);
  if (getLecturesError) {
    throw new Error("error in retrieving lectures");
  }

  const dayName = now.setLocale("en-US").toFormat("cccc");
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
  const currentPeriod = getCurrentPeriod(periodSchedules, nowMinutes);
  const lastPeriodEndMinutes = periodSchedules.reduce((latest, schedule) => {
    return Math.max(latest, timetzToMinutes(schedule.end_time));
  }, -1);
  const isDayFinished =
    currentPeriod === undefined &&
    lastPeriodEndMinutes !== -1 &&
    nowMinutes >= lastPeriodEndMinutes;
  const currentLecture = selectLecture({
    schedule,
    currentPeriod,
    selectedLectureId: lectureId,
  });

  if (!currentLecture?.id) {
    return data<TeacherDashboardLoaderData>(
      {
        schedule,
        currentLecture,
        students: [],
        currentPeriod,
        dateLabel,
        weekdayLabel,
        viewState: resolveDashboardViewState({
          hasSemester: true,
          hasCurrentLecture: false,
          isDayFinished,
          hasExplicitSelection: Boolean(lectureId),
        }),
      },
      { headers },
    );
  }

  const { data: enrollments, error: getEnrollmentsError } = await supabase
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
  if (getEnrollmentsError) {
    throw new Error("error in retrieving enrollments");
  }

  const students = (enrollments ?? [])
    .map(({ student }) => student)
    .filter((student): student is { id: string; name: string; num: string } =>
      Boolean(student?.id && student.name && student.num),
    );

  const { data: attendances, error: getAttendancesError } = await supabase
    .from("attendances")
    .select("student_id, status")
    .eq("lecture_id", currentLecture.id)
    .eq("attendance_date", today)
    .eq("period", currentLecture.period);
  if (getAttendancesError) {
    throw new Error("error in retrieving attendances");
  }

  return data<TeacherDashboardLoaderData>(
    {
      schedule,
      currentLecture,
      students: mergeStudentsWithAttendances({
        students,
        attendances: attendances ?? [],
      }),
      currentPeriod,
      dateLabel,
      weekdayLabel,
      viewState: "active-lecture",
    },
    { headers },
  );
}

export function TeacherDashboardPage({
  loaderData,
}: {
  loaderData: TeacherDashboardLoaderData;
}) {
  const {
    schedule,
    currentLecture,
    students,
    dateLabel,
    weekdayLabel,
    viewState,
  } = loaderData;

  return (
    <div className="flex min-h-full flex-1 w-full bg-muted/30">
      <div className="mx-auto flex min-h-full w-full max-w-[1400px] flex-col gap-4 p-4 lg:flex-row lg:items-stretch lg:gap-6 lg:p-6">
        <ScheduleSidebar
          schedule={schedule}
          currentLecture={currentLecture}
          dateLabel={dateLabel}
          weekdayLabel={weekdayLabel}
        />

        <div className="min-h-0 flex-1 lg:h-full">
          <LectureAttendancePanel
            viewState={viewState}
            currentLecture={currentLecture}
            students={students}
          />
        </div>
      </div>
    </div>
  );
}
