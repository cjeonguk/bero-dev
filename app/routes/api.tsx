import { PostgrestError } from "@supabase/supabase-js";
import type { Route } from "./+types/api";
import { createClient } from "~/lib/supabase/server";

interface Body {
  deviceID: string;
  rssi: number;
  deviceName: string;
  timestamp: string;
  classroom: string;
}

interface PeriodSchedules {
  period: number;
  start_time: string;
  end_time: string;
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
      .period_schedules as unknown as PeriodSchedules[];

    const todayStr = new Date().toISOString().split("T")[0];

    const now = new Date();

    let currentPeriod = 0;

    periodSchedules.forEach((element) => {
      const startTime = new Date(`${todayStr}T${element.start_time}`);
      const endTime = new Date(`${todayStr}T${element.start_time}`);

      if (startTime <= now && now <= endTime) currentPeriod = element.period;
    });

    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

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
      const schedule = schedules.find((obj) => obj?.day === days[now.getDay()]);

      return schedule?.period === currentPeriod;
    });

    const { data: classroomID, error: classroomError } = await supabase
      .from("classrooms")
      .select("id")
      .eq("name", body.classroom)
      .single();

    if (classroomError) throw classroomError;

    if (!classroomID || !classroomID.id)
      return { success: false, studentName: studentInfo.name };

    const { error: updateError } = await supabase
      .from("students")
      .update({ last_detected_place: classroomID.id })
      .match({ name: studentInfo.name });

    if (updateError) throw updateError;

    if (classInfo?.lecture.classroom_id === classroomID.id) {
      // TODO: update - 수업 시작 시 자동으로 absent attendance row들이 생성되어야 함
      const { error: attendanceError } = await supabase
        .from("attendances")
        .update({ status: "present" })
        .match({
          student_id: studentInfo.id,
          lecture_id: classInfo.lecture.id,
          attendance_date: todayStr,
        });

      if (attendanceError) throw attendanceError;
    }

    return { success: true, studentName: studentInfo.name };
  } catch (error) {
    if (error instanceof PostgrestError)
      console.error("API ERROR:", error.message);
  }
}
