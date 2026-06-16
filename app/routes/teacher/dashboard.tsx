import type { Route } from "./+types/dashboard";
import { createClient } from "~/lib/supabase/server";
import { Link, redirect } from "react-router";
import { DateTime } from "luxon";
import { timetzToMinutes } from "~/utils/dates";
import type { Database } from "~/types/database.types";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "~/components/ui/empty";
import { cn } from "~/lib/utils";

type LecturePeriod = {
  id?: string;
  name: string;
  module?: string;
  period: number;
};

type Student = {
  id: string;
  name: string;
  num: string;
  attendance: Database["public"]["Enums"]["attendance_status"];
};

type LectureScheduleEntry = {
  day: string;
  period: number;
};

type PeriodScheduleEntry = {
  period: number;
  start_time: string;
  end_time: string;
};

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return redirect("/login");
  }

  const now = DateTime.now().setZone("Asia/Seoul");
  const today = now.toFormat("yyyy-MM-dd");

  const { data: teacher, error } = await supabase
    .from("teachers")
    .select("school_id, id")
    .eq("id", user.id)
    .single();
  if (error) {
    throw new Error("account is not a teacher");
  }

  const { data: semester, error: getSemesterError } = await supabase
    .from("semester_schedules")
    .select("id, start_period, end_period, period_schedules")
    .eq("school_id", teacher.school_id!)
    .lte("start_date", today)
    .gte("end_date", today)
    .single();
  if (getSemesterError) {
    throw new Error("error in retrieving semesters");
  }

  const { data: semesterLectures, error: getLecturesError } = await supabase
    .from("lectures")
    .select("schedule, id, name, module")
    .eq("teacher_id", teacher.id)
    .eq("semester_id", semester.id!);
  if (getLecturesError) {
    throw new Error("error in retrieving lectures");
  }

  const schedule: LecturePeriod[] = [];

  const dayName = now.setLocale("en-US").toFormat("cccc");
  for (const lecture of semesterLectures) {
    const lectureSchedule = (lecture.schedule ?? []) as LectureScheduleEntry[];

    lectureSchedule
      .filter((dayPeriod) => dayPeriod.day === dayName)
      .forEach((dayPeriod) => {
        schedule.push({
          id: lecture.id,
          name: lecture.name!,
          module: lecture.module!,
          period: dayPeriod.period,
        });
      });
  }

  for (
    let period = semester.start_period!;
    period <= semester.end_period!;
    period++
  ) {
    if (!schedule.some((lecture) => lecture.period === period)) {
      schedule.push({ period, name: "-" });
    }
  }

  schedule.sort((lecture1, lecture2) => lecture1.period - lecture2.period);

  const nowMinutes = now.hour * 60 + now.minute;
  const periodSchedules = (semester.period_schedules ??
    []) as PeriodScheduleEntry[];
  const currentPeriod = periodSchedules.find(({ start_time, end_time }) => {
    const startMinutes = timetzToMinutes(start_time);
    const endMinutes = timetzToMinutes(end_time);
    return nowMinutes >= startMinutes && nowMinutes < endMinutes;
  })?.period;
  const currentLecture =
    params["*"] === ""
      ? currentPeriod === undefined
        ? undefined
        : schedule[currentPeriod - semester.start_period!]
      : schedule.find((lecture) => lecture.id === params["*"]);

  if (!currentLecture?.id) {
    return {
      schedule,
      currentLecture,
      students: [],
      currentPeriod,
      dateLabel: now.setLocale("ko-KR").toFormat("yyyy/MM/dd"),
      weekdayLabel: now.setLocale("ko-KR").toFormat("ccc"),
    };
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

  const students: Student[] = enrollments.map(({ student }) => ({
    id: student.id,
    name: student.name!,
    num: student.num!,
    attendance: "absent",
  }));

  const { data: attendances, error: getAttendancesError } = await supabase
    .from("attendances")
    .select("student_id, status")
    .eq("lecture_id", currentLecture.id)
    .eq("attendance_date", today)
    .eq("period", currentLecture.period);
  if (getAttendancesError) {
    throw new Error("error in retrieving attendances");
  }

  let effectiveAttendances = attendances ?? [];

  if (effectiveAttendances.length === 0 && students.length > 0) {
    const attendanceRows = students.map(({ id }) => ({
      student_id: id,
      lecture_id: currentLecture.id,
      attendance_date: today,
      status: "absent" as const,
      period: currentLecture.period,
    }));

    const { error: insertAttendancesError } = await supabase
      .from("attendances")
      .insert(attendanceRows);

    if (insertAttendancesError)
      throw new Error("error in creating attendances");

    effectiveAttendances = attendanceRows.map(({ student_id, status }) => ({
      student_id,
      status,
    }));
  }

  for (const attendance of effectiveAttendances) {
    const student = students.find(
      (student) => student.id === attendance.student_id,
    );
    if (student) student.attendance = attendance.status!;
  }

  return {
    schedule,
    currentLecture,
    students,
    currentPeriod,
    dateLabel: now.setLocale("ko-KR").toFormat("yyyy/MM/dd"),
    weekdayLabel: now.setLocale("ko-KR").toFormat("ccc"),
  };
}

export default function TeacherDashboard({ loaderData }: Route.ComponentProps) {
  const { schedule, currentLecture, students, dateLabel, weekdayLabel } =
    loaderData;
  const presentCount = students.filter(
    (student) => student.attendance === "present",
  ).length;

  return (
    <div className="h-[calc(100vh-6rem)] w-full bg-muted/30">
      <div className="mx-auto flex h-full w-full max-w-[1400px] flex-col gap-4 p-4 lg:flex-row lg:gap-6 lg:p-6">
        <Card className="w-full lg:w-80 lg:shrink-0">
          <CardHeader className="pt-8 pb-1">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="이전 날짜"
              >
                {"〈"}
              </Button>
              <p className="flex-1 text-center text-xl font-semibold [font-variant-numeric:tabular-nums]">
                {dateLabel} {weekdayLabel}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="다음 날짜"
              >
                {"〉"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-col gap-2">
              {schedule.map((period) => {
                const hasLecture = Boolean(period.id);
                const isActive = period.period === currentLecture?.period;

                if (!hasLecture) {
                  return (
                    <div
                      key={`period-${period.period}`}
                      className="flex h-10 items-center rounded-lg px-3 text-sm text-muted-foreground"
                    >
                      <span className="font-medium [font-variant-numeric:tabular-nums]">
                        {period.period}교시 -
                      </span>
                    </div>
                  );
                }

                return (
                  <Button
                    key={period.id}
                    asChild
                    variant={isActive ? "secondary" : "ghost"}
                    className="h-10 justify-between"
                  >
                    <Link to={`/teacher/dashboard/${period.id}`}>
                      <span className="truncate text-sm font-medium [font-variant-numeric:tabular-nums]">
                        {period.period}교시 {period.name}
                      </span>
                    </Link>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="min-h-0 flex-1">
          {!currentLecture ? (
            <Card className="h-full min-h-[360px]">
              <CardContent className="flex h-full items-center justify-center">
                <Empty className="max-w-lg border">
                  <EmptyHeader>
                    <EmptyTitle>선택된 수업이 없습니다</EmptyTitle>
                    <EmptyDescription>
                      왼쪽 시간표에서 수업을 선택하면 학생 출결 현황을 볼 수
                      있습니다.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </CardContent>
            </Card>
          ) : (
            <Card className="min-h-0 h-full">
              <CardHeader>
                <CardTitle className="text-2xl">
                  {currentLecture.name}
                </CardTitle>
                <CardDescription>
                  {currentLecture.module ? `${currentLecture.module} | ` : ""}
                  {currentLecture.period}교시 수업
                </CardDescription>
                <CardAction className="flex flex-col items-end gap-2">
                  <Button type="button" variant="outline" size="sm">
                    수정
                  </Button>
                  <p className="pr-3.5 text-sm text-muted-foreground">
                    {presentCount}/{students.length}
                  </p>
                </CardAction>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4">
                {students.length === 0 ? (
                  <Empty className="min-h-[300px] border">
                    <EmptyHeader>
                      <EmptyTitle>등록된 학생이 없습니다</EmptyTitle>
                      <EmptyDescription>
                        현재 수업에 등록된 학생이 없어 출결을 표시할 수
                        없습니다.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {students.map((student) => {
                      const attendancePresentation = getAttendancePresentation(
                        student.attendance,
                      );

                      return (
                        <Card
                          key={student.id}
                          className={cn(
                            "py-4",
                            attendancePresentation.cardClassName,
                          )}
                          size="sm"
                        >
                          <CardContent className="flex flex-col gap-2">
                            <div className="flex items-start justify-between gap-2">
                              <p className="truncate text-lg font-semibold">
                                {student.name}
                              </p>
                              <Badge
                                variant={attendancePresentation.badgeVariant}
                              >
                                {attendancePresentation.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {student.num}
                            </p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function getAttendancePresentation(
  attendance: Database["public"]["Enums"]["attendance_status"],
) {
  if (attendance === "present") {
    return {
      label: "출석",
      badgeVariant: "default" as const,
      cardClassName: "border-primary/30 bg-primary/5",
    };
  }

  if (attendance === "absent") {
    return {
      label: "결석",
      badgeVariant: "destructive" as const,
      cardClassName: "border-destructive/30 bg-destructive/5",
    };
  }

  if (attendance === "late") {
    return {
      label: "지각",
      badgeVariant: "secondary" as const,
      cardClassName: "border-border bg-muted/40",
    };
  }

  if (attendance === "excused") {
    return {
      label: "공결",
      badgeVariant: "secondary" as const,
      cardClassName: "border-border bg-muted/40",
    };
  }

  return {
    label: "병결",
    badgeVariant: "secondary" as const,
    cardClassName: "border-border bg-muted/40",
  };
}
