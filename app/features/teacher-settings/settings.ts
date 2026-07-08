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
  clientType: "teacher" | "classroom";
  defaultClassroomId?: string;
  defaultClassroomName?: string;
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
  };
};

export type TeacherSettingsActionResult = {
  ok: boolean;
  message: string;
  token?: string;
};

export type AttendanceOverrideStatus = Extract<
  Database["public"]["Enums"]["attendance_status"],
  "excused" | "sick leave"
>;

export type AttendanceMarkInput = {
  studentId: string;
  status: AttendanceOverrideStatus;
  startDate: string;
  endDate: string;
  startPeriod: number;
  endPeriod: number;
};

export type TeacherActor = {
  id: string;
  school_id: string;
  name: string | null;
  is_admin: boolean | null;
};

const requiredFieldMessages: Record<string, string> = {
  intent: "요청 정보를 다시 확인해 주세요.",
  name: "이름을 입력해 주세요.",
  classroomId: "교실을 선택해 주세요.",
  defaultClassroomId: "기본 교실을 선택해 주세요.",
  lectureId: "수업 정보를 다시 확인해 주세요.",
  clientId: "클라이언트 정보를 다시 확인해 주세요.",
  studentId: "학생을 선택해 주세요.",
  teacherId: "선생님 정보를 다시 확인해 주세요.",
  status: "상태를 선택해 주세요.",
  num: "번호를 입력해 주세요.",
  email: "이메일을 입력해 주세요.",
  password: "임시 비밀번호를 입력해 주세요.",
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
    throw new Error(
      requiredFieldMessages[label] ?? "필수 항목을 입력해 주세요.",
    );
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
): value is AttendanceOverrideStatus {
  return value === "excused" || value === "sick leave";
}

export function parseAttendanceMarkInput(input: {
  studentId: FormDataEntryValue | null;
  status: FormDataEntryValue | null;
  startDate: FormDataEntryValue | null;
  endDate: FormDataEntryValue | null;
  startPeriod: FormDataEntryValue | null;
  endPeriod: FormDataEntryValue | null;
}): AttendanceMarkInput {
  const studentId = toOptionalString(input.studentId);
  if (!studentId) {
    throw new Error("학생을 선택해 주세요.");
  }

  const status = toOptionalString(input.status);
  if (!status || !isAttendanceOverrideStatus(status)) {
    throw new Error("출석 상태를 다시 선택해 주세요.");
  }

  const startDate = toOptionalString(input.startDate);
  if (!startDate) {
    throw new Error("시작 날짜를 선택해 주세요.");
  }

  const endDate = toOptionalString(input.endDate);
  if (!endDate) {
    throw new Error("종료 날짜를 선택해 주세요.");
  }

  const startPeriod = toOptionalNumber(input.startPeriod);
  if (startPeriod === undefined) {
    throw new Error("시작 교시를 입력해 주세요.");
  }

  const endPeriod = toOptionalNumber(input.endPeriod);
  if (endPeriod === undefined) {
    throw new Error("종료 교시를 입력해 주세요.");
  }

  if (startPeriod < 1) {
    throw new Error("시작 교시는 1 이상이어야 합니다.");
  }

  if (endPeriod < 1) {
    throw new Error("종료 교시는 1 이상이어야 합니다.");
  }

  if (startDate > endDate) {
    throw new Error("종료일은 시작일보다 이후여야 합니다.");
  }

  if (startDate === endDate && startPeriod > endPeriod) {
    throw new Error(
      "같은 날짜에서는 종료 교시가 시작 교시보다 작을 수 없습니다.",
    );
  }

  return {
    studentId,
    status,
    startDate,
    endDate,
    startPeriod,
    endPeriod,
  };
}

export function isStudentStatus(
  value: string,
): value is Database["public"]["Enums"]["student_status"] {
  return ["active", "inactive", "graduated", "leave"].includes(value);
}
