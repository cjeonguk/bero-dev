import type { Route } from "./+types/dashboard";
import { createClient } from "~/lib/supabase/server";
import { Link, redirect } from "react-router";
import { DateTime } from "luxon";
import { timetzToMinutes } from "~/utils/dates";
import type { Database } from "~/types/supabase";

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

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return redirect("/login");
  }

  const now = DateTime.now().setZone("Asia/Seoul").setLocale("en-US");
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
    .select("name, start_period, end_period, period_schedules")
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
    .eq("semester", semester.name!);
  if (getLecturesError) {
    throw new Error("error in retrieving lectures");
  }

  const schedule: LecturePeriod[] = [];

  const dayName = now.toFormat("cccc");
  for (const lecture of semesterLectures) {
    lecture
      .schedule!.filter((dayPeriod) => dayPeriod!.day === dayName)
      .forEach((dayPeriod) => {
        schedule.push({
          id: lecture.id,
          name: lecture.name!,
          module: lecture.module!,
          period: dayPeriod!.period,
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
  const currentPeriod = semester.period_schedules?.find(
    ({ start_time, end_time }) => {
      const startMinutes = timetzToMinutes(start_time);
      const endMinutes = timetzToMinutes(end_time);
      return nowMinutes >= startMinutes && nowMinutes < endMinutes;
    },
  )?.period;
  const currentLecture =
    params["*"] === ""
      ? schedule[currentPeriod - semester.start_period!]
      : schedule.find((lecture) => lecture.id === params["*"]);

  if (!currentLecture?.id) return { schedule, currentLecture, students: [] };

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
  const absentList: typeof attendances = [];
  if (getAttendancesError) {
    students.forEach(async ({ id }) => {
      const { error: insertAttendancesError } = await supabase
        .from("attendances")
        .insert({
          student_id: id,
          lecture_id: currentLecture.id,
          status: "absent",
          period: currentLecture.period,
        });
      if (insertAttendancesError) throw new Error("Error in attendance");
      absentList.push({ student_id: id, status: "absent" });
    });
  }

  for (const attendance of attendances ?? absentList) {
    const student = students.find(
      (student) => student.id === attendance.student_id,
    );
    if (student) student.attendance = attendance.status!;
  }

  return {
    schedule,
    currentLecture,
    students,
  };
}

export default function TeacherSidebar({ loaderData }: Route.ComponentProps) {
  const { schedule, currentLecture, students } = loaderData;

  return (
    <div className="flex w-full h-[calc(100vh-6rem)]">
      <div className="flex flex-col self-center justify-center h-full bg-[#D9D9D9]">
        <div className="text-[28px] border-b-2 border-black pt-5 pl-4 pb-2">
          2025/11/21 [금]
        </div>
        <div className=" flex flex-col gap-1 p-12">
          {schedule.map((period, index) => (
            <Link
              key={index}
              to={
                schedule[index].id === undefined
                  ? "#"
                  : `/teacher/dashboard/${schedule[index].id}`
              }
              className={`text-[28px] [font-variant-numeric:tabular-nums] leading-none hover:cursor-pointer py-2 rounded-sm ${period.period === currentLecture?.period ? "bg-amber-500" : ""}`}
            >
              <span className="font-semibold">{period.period}.</span>{" "}
              {period.name ?? "-"}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex flex-col grow self-center items-center px-28">
        {currentLecture && (
          <>
            <div className="flex w-full max-w-6xl mb-10 items-center">
              <div className="text-[44px] mr-8 leading-none" tabIndex={0}>
                {currentLecture.name} ({currentLecture.module ?? ""})
              </div>
              <button className="flex items-center justify-center leading-none bg-[#e4e4e4] text-[24px] px-5 py-2 rounded-[32px] hover:cursor-pointer">
                수정
              </button>
            </div>
            <div
              className={`w-full max-w-6xl grid gap-2 ${students.length > 12 ? "content-stretch" : "grid-rows-4"} h-[480px]`}
              style={{
                gridTemplateColumns: `repeat(${getColumnCount(students.length)}, minmax(0, 1fr))`,
              }}
            >
              {students.map((student) => (
                <div
                  className={`flex flex-col items-center justify-center border-6 border-[#92A2C1] ${getAttendanceColor(student.attendance)}`}
                  key={student.id}
                >
                  <div className="text-[36px]">{student.name}</div>
                  <div className="text-[16px]">{student.num}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function getAttendanceColor(
  attendance: Database["public"]["Enums"]["attendance_status"],
) {
  if (attendance === "absent") return "bg-[#DB5555]";
  return "bg-[#63D119]";
}

function getColumnCount(arrayLength: number) {
  if (arrayLength <= 16) return 4;
  return Math.ceil(Math.sqrt(arrayLength));
}
