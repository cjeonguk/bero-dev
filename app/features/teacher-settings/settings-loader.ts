import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~/types/database.types";
import {
  normalizeLectureHolidayEntries,
  normalizeLectureScheduleEntries,
} from "./settings";
import type {
  TeacherActor,
  TeacherSettingsLoaderData,
  TeacherSettingsStudent,
} from "./settings";

type TeacherSettingsSupabaseClient = SupabaseClient<Database>;

async function loadTeacherActor({
  supabase,
  userId,
}: {
  supabase: TeacherSettingsSupabaseClient;
  userId: string;
}) {
  const { data, error } = await supabase
    .from("teachers")
    .select("id, school_id, name, is_admin")
    .eq("user_id", userId)
    .single();

  if (error || !data?.id || !data.school_id) {
    throw new Error("account is not a teacher");
  }

  return {
    id: data.id,
    school_id: data.school_id,
    name: data.name,
    is_admin: data.is_admin,
  } satisfies TeacherActor;
}

function normalizeStudent(
  student:
    | {
        id: string;
        name: string | null;
        num: string | null;
        status: Database["public"]["Enums"]["student_status"];
        device_id?: string | null;
        last_detected_place?: string | null;
      }
    | null
    | undefined,
): TeacherSettingsStudent | null {
  if (!student?.id || !student.name || !student.num) {
    return null;
  }

  return {
    id: student.id,
    name: student.name,
    num: student.num,
    status: student.status,
    deviceId: student.device_id ?? undefined,
    lastDetectedPlace: student.last_detected_place ?? undefined,
  };
}

export async function loadTeacherSettingsData({
  supabase,
  userId,
  email,
}: {
  supabase: TeacherSettingsSupabaseClient;
  userId: string;
  email: string;
}) {
  const actor = await loadTeacherActor({ supabase, userId });

  const [
    lecturesResult,
    studentsResult,
    classroomsResult,
    semestersResult,
    clientsResult,
  ] = await Promise.all([
    supabase
      .from("lectures")
      .select("id, name, module, classroom_id, semester_id, schedule, holiday")
      .eq("teacher_id", actor.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("students")
      .select("id, name, num, status, device_id, last_detected_place")
      .eq("school_id", actor.school_id)
      .order("num", { ascending: true }),
    supabase
      .from("classrooms")
      .select("id, name")
      .eq("school_id", actor.school_id)
      .order("name", { ascending: true }),
    supabase
      .from("semester_schedules")
      .select("id, name")
      .eq("school_id", actor.school_id)
      .order("id", { ascending: false }),
    supabase
      .from("attendance_clients")
      .select(
        "id, name, active, default_classroom_id, owner_teacher_id, last_seen_at, classroom:classrooms!attendance_clients_default_classroom_id_fkey(name)",
      )
      .eq("owner_teacher_id", actor.id)
      .order("created_at", { ascending: true }),
  ]);

  const lectureRows = lecturesResult.data ?? [];
  const lectureIds = lectureRows.map((lecture) => lecture.id).filter(Boolean);
  const enrollmentRows = lectureIds.length
    ? ((
        await supabase
          .from("enrollments")
          .select("lecture_id, student:student_id(id, name, num, status)")
          .in("lecture_id", lectureIds)
      ).data ?? [])
    : [];

  const lectureStudents = new Map<string, TeacherSettingsStudent[]>();
  enrollmentRows.forEach((row) => {
    const student = normalizeStudent(row.student);
    if (!student || !row.lecture_id) {
      return;
    }

    const students = lectureStudents.get(row.lecture_id) ?? [];
    students.push(student);
    lectureStudents.set(row.lecture_id, students);
  });

  const students = (studentsResult.data ?? [])
    .map((student) => normalizeStudent(student))
    .filter((student): student is TeacherSettingsStudent => Boolean(student));

  const admin = actor.is_admin
    ? await (async () => {
        const [adminClientsResult, adminTeachersResult] = await Promise.all([
          supabase
            .from("attendance_clients")
            .select(
              "id, name, active, default_classroom_id, owner_teacher_id, last_seen_at, classroom:classrooms!attendance_clients_default_classroom_id_fkey(name)",
            )
            .eq("school_id", actor.school_id)
            .order("created_at", { ascending: true }),
          supabase
            .from("teachers")
            .select("id, user_id, name, is_admin")
            .eq("school_id", actor.school_id)
            .order("created_at", { ascending: true }),
        ]);

        return {
          clients: (adminClientsResult.data ?? [])
            .map((client) => ({
              id: client.id,
              name: client.name,
              active: client.active,
              clientType: (client.owner_teacher_id === null
                ? "classroom"
                : "teacher") as "teacher" | "classroom",
              defaultClassroomId: client.default_classroom_id ?? undefined,
              defaultClassroomName: client.classroom?.name ?? undefined,
              ownerTeacherId: client.owner_teacher_id ?? undefined,
              lastSeenAt: client.last_seen_at ?? undefined,
            }))
            .filter((client) => client.clientType === "classroom"),
          students,
          teachers: (adminTeachersResult.data ?? [])
            .filter((teacher) => teacher.id && teacher.name)
            .map((teacher) => ({
              id: teacher.id,
              userId: teacher.user_id ?? undefined,
              name: teacher.name ?? "",
              isAdmin: Boolean(teacher.is_admin),
            })),
        };
      })()
    : null;

  return {
    account: {
      email,
      teacherId: actor.id,
      name: actor.name ?? "",
      isAdmin: Boolean(actor.is_admin),
      schoolId: actor.school_id,
    },
    classrooms: (classroomsResult.data ?? []).filter(
      (classroom): classroom is { id: string; name: string } =>
        Boolean(classroom.id && classroom.name),
    ),
    semesters: (semestersResult.data ?? []).filter(
      (semester): semester is { id: number; name: string } =>
        Boolean(semester.id && semester.name),
    ),
    students,
    lectures: lectureRows.map((lecture) => ({
      id: lecture.id,
      name: lecture.name ?? "",
      module: lecture.module ?? undefined,
      classroomId: lecture.classroom_id ?? undefined,
      semesterId: lecture.semester_id ?? undefined,
      schedule: normalizeLectureScheduleEntries(lecture.schedule ?? []),
      holiday: normalizeLectureHolidayEntries(lecture.holiday ?? []),
      students: lectureStudents.get(lecture.id) ?? [],
    })),
    myClients: (clientsResult.data ?? []).map((client) => ({
      id: client.id,
      name: client.name,
      active: client.active,
      clientType: "teacher" as const,
      defaultClassroomId: client.default_classroom_id ?? undefined,
      defaultClassroomName: client.classroom?.name ?? undefined,
      ownerTeacherId: client.owner_teacher_id ?? undefined,
      lastSeenAt: client.last_seen_at ?? undefined,
    })),
    admin,
  } satisfies TeacherSettingsLoaderData;
}
