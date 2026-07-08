import { DateTime } from "luxon";
import type { Database, Json } from "~/types/database.types";

export type TeacherSettingsStudent = {
  id: string;
  name: string;
  num: string;
  status: Database["public"]["Enums"]["student_status"];
  deviceId?: string;
  lastDetectedPlace?: string;
};

export type TeacherSettingsLecture = {
  id: string;
  name: string;
  module?: string;
  classroomId?: string;
  semesterId?: number;
  schedule: Json[];
  holiday: Json[];
  students: TeacherSettingsStudent[];
};

export type TeacherSettingsClient = {
  id: string;
  name: string;
  active: boolean;
  defaultClassroomId?: string;
  ownerTeacherId?: string;
  lastSeenAt?: string;
};

export type TeacherSettingsTeacher = {
  id: string;
  userId?: string;
  name: string;
  isAdmin: boolean;
};

export type TeacherSettingsLoaderData = {
  account: {
    email: string;
    teacherId: string;
    name: string;
    isAdmin: boolean;
    schoolId: string;
  };
  classrooms: Array<{ id: string; name: string }>;
  semesters: Array<{ id: number; name: string }>;
  students: TeacherSettingsStudent[];
  lectures: TeacherSettingsLecture[];
  myClients: TeacherSettingsClient[];
  admin: null | {
    clients: TeacherSettingsClient[];
    students: TeacherSettingsStudent[];
    teachers: TeacherSettingsTeacher[];
    lectureSessions: Array<{
      id: string;
      name: string;
      sessionDate: string;
      period: number;
    }>;
  };
};

export type TeacherSettingsActionResult = {
  ok: boolean;
  message: string;
  token?: string;
};

export type TeacherActor = {
  id: string;
  school_id: string;
  name: string | null;
  is_admin: boolean | null;
};

export function getTodayInSeoul(now = new Date()) {
  return DateTime.fromJSDate(now, { zone: "Asia/Seoul" }).toFormat(
    "yyyy-MM-dd",
  );
}

export function parseJsonArrayField(value: FormDataEntryValue | null) {
  if (!value || typeof value !== "string" || value.trim() === "") {
    return [] as Json[];
  }

  const parsed = JSON.parse(value) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("expected JSON array");
  }

  return parsed as Json[];
}

export function toOptionalString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

export function toRequiredString(
  value: FormDataEntryValue | null,
  label: string,
) {
  const parsed = toOptionalString(value);
  if (!parsed) {
    throw new Error(`${label} is required`);
  }

  return parsed;
}

export function toOptionalNumber(value: FormDataEntryValue | null) {
  const parsed = toOptionalString(value);
  if (!parsed) {
    return undefined;
  }

  const numeric = Number(parsed);
  if (!Number.isInteger(numeric)) {
    throw new Error("expected integer value");
  }

  return numeric;
}

export function isAttendanceOverrideStatus(
  value: string,
): value is Extract<
  Database["public"]["Enums"]["attendance_status"],
  "excused" | "sick leave"
> {
  return value === "excused" || value === "sick leave";
}

export function isStudentStatus(
  value: string,
): value is Database["public"]["Enums"]["student_status"] {
  return ["active", "inactive", "graduated", "leave"].includes(value);
}
