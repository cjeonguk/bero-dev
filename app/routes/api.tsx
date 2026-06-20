import { PostgrestError } from "@supabase/supabase-js";
import { DateTime } from "luxon";
import type { Route } from "./+types/api";
import { createClient } from "~/lib/supabase/server";
import { getCurrentPeriod, type PeriodScheduleEntry } from "~/utils/schedules";

interface Body {
  deviceID: string;
  rssi: number;
  deviceName: string;
  timestamp: string;
  classroom: string;
}

interface Schedules {
  day: string;
  period: number;
}

export async function action({ request }: Route.ActionArgs) {
  const body = (await request.json()) as Body;

  const { supabase } = createClient(request);
  try {
    const { data: studentInfo, error: studentError } = await supabase
      .from("students")
      .select(
        `
        name,
        id,
        school:school_id (
          semester:current_semester_id (
            id,
            period_schedules
          )
        )
      `,
      )
      .eq("device_id", body.deviceID)
      .single();

    if (studentError) throw studentError;

    if (
      !studentInfo ||
      !studentInfo.name ||
      !studentInfo.id ||
      !studentInfo.school
    )
      return { success: false, studentName: "" };

    const periodSchedules = studentInfo.school.semester
      .period_schedules as unknown as PeriodScheduleEntry[];

    const now = DateTime.now().setZone("Asia/Seoul").setLocale("en-US");
    const todayStr = now.toFormat("yyyy-MM-dd");

    const nowMinutes = now.hour * 60 + now.minute;
    const currentPeriod = getCurrentPeriod(periodSchedules, nowMinutes);

    if (currentPeriod === undefined) {
      return { success: false, studentName: studentInfo.name };
    }

    const dayName = now.toFormat("cccc");

    const { data: classList, error: enrollmentError } = await supabase
      .from("enrollments")
      .select(
        `
        lecture:lecture_id (
          id,
          classroom_id,
          schedule
        )
      `,
      )
      .match({
        student_id: studentInfo.id,
        semester_id: studentInfo.school.semester.id,
      });

    if (enrollmentError) throw enrollmentError;

    const classInfo = classList.find((element) => {
      const schedules = element.lecture.schedule as unknown as Schedules[];
      const schedule = schedules.find((obj) => obj?.day === dayName);

      return schedule?.period === currentPeriod;
    });

    if (!classInfo?.lecture.id || !classInfo.lecture.classroom_id) {
      return { success: false, studentName: studentInfo.name };
    }

    const { data: classroomID, error: classroomError } = await supabase
      .from("classrooms")
      .select("name")
      .eq("id", classInfo.lecture.classroom_id)
      .single();

    if (classroomError) throw classroomError;

    if (!classroomID || !classroomID.name)
      return { success: false, studentName: studentInfo.name };

    if (classroomID.name === body.classroom) {
      const { error: updateError } = await supabase
        .from("students")
        .update({ last_detected_place: classInfo.lecture.classroom_id })
        .match({ id: studentInfo.id });

      if (updateError) throw updateError;

      const { error: attendanceError } = await supabase
        .from("attendances")
        .upsert(
          {
            student_id: studentInfo.id,
            lecture_id: classInfo.lecture.id,
            attendance_date: todayStr,
            period: currentPeriod,
            status: "present",
          },
          {
            onConflict: "student_id,lecture_id,attendance_date,period",
          },
        );

      if (attendanceError) throw attendanceError;
    }

    return { success: true, studentName: studentInfo.name };
  } catch (error) {
    if (error instanceof PostgrestError)
      console.error("API ERROR:", error.message);
  }
}
