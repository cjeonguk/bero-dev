import type { ReactNode } from "react";
import {
  Form,
  Link,
  data,
  redirect,
  useActionData,
  useNavigation,
  useSearchParams,
} from "react-router";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "~/components/ui/empty";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { createServiceRoleClient, createClient } from "~/lib/supabase/server";
import { handleTeacherSettingsAction } from "~/features/teacher-settings/settings-actions";
import { loadTeacherSettingsData } from "~/features/teacher-settings/settings-loader";
import type {
  TeacherSettingsActionResult,
  TeacherSettingsLecture,
} from "~/features/teacher-settings/settings";
import type { Route } from "./+types/teacher.settings";

type SettingsSectionId =
  | "profile"
  | "lectures"
  | "clients"
  | "admin-clients"
  | "admin-students"
  | "admin-teachers"
  | "admin-attendance";

type SettingsSection = {
  id: SettingsSectionId;
  label: string;
  adminOnly?: boolean;
};

const baseSections: SettingsSection[] = [
  { id: "profile", label: "본인 계정 정보" },
  { id: "lectures", label: "등록된 수업 목록" },
  { id: "clients", label: "클라이언트 등록" },
];

const adminSections: SettingsSection[] = [
  { id: "admin-clients", label: "전체 클라이언트", adminOnly: true },
  { id: "admin-students", label: "학생 관리", adminOnly: true },
  { id: "admin-teachers", label: "선생 관리", adminOnly: true },
  { id: "admin-attendance", label: "공결 / 병결 처리", adminOnly: true },
];

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase, headers } = createClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login", { headers });
  }

  return data(
    await loadTeacherSettingsData({
      supabase,
      userId: user.id,
      email: user.email ?? "",
    }),
    { headers },
  );
}

export async function action({ request }: Route.ActionArgs) {
  const { supabase, headers } = createClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login", { headers });
  }

  try {
    return data(
      await handleTeacherSettingsAction({
        request,
        supabase,
        serviceRoleSupabase: createServiceRoleClient(),
        userId: user.id,
      }),
      { headers },
    );
  } catch (error) {
    return data(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "설정 저장 중 오류가 발생했습니다.",
      } satisfies TeacherSettingsActionResult,
      { headers, status: 400 },
    );
  }
}

export default function TeacherSettings({ loaderData }: Route.ComponentProps) {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const isSubmitting = navigation.state !== "idle";
  const sections = loaderData.admin
    ? [...baseSections, ...adminSections]
    : baseSections;
  const activeSection = getActiveSection({
    section: searchParams.get("section"),
    sections,
  });

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 p-4 lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start lg:gap-6 lg:p-6">
      <SettingsMenu sections={sections} activeSection={activeSection} />

      <div className="flex min-w-0 flex-col gap-6">
        {actionData ? <ActionNotice actionData={actionData} /> : null}

        <SettingsSectionPanel
          section={activeSection}
          loaderData={loaderData}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}

function getActiveSection({
  section,
  sections,
}: {
  section: string | null;
  sections: SettingsSection[];
}) {
  if (section && sections.some((item) => item.id === section)) {
    return section as SettingsSectionId;
  }

  return sections[0]?.id ?? "profile";
}

function SettingsMenu({
  sections,
  activeSection,
}: {
  sections: SettingsSection[];
  activeSection: SettingsSectionId;
}) {
  const teacherSections = sections.filter((section) => !section.adminOnly);
  const schoolAdminSections = sections.filter((section) => section.adminOnly);

  return (
    <Card className="w-full lg:sticky lg:top-6 lg:max-h-[calc(100svh-3rem)] lg:overflow-auto">
      <CardHeader>
        <CardTitle>설정 메뉴</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <SettingsMenuGroup
            title="선생님 설정"
            sections={teacherSections}
            activeSection={activeSection}
          />

          {schoolAdminSections.length > 0 ? (
            <>
              <Separator />
              <SettingsMenuGroup
                title="학교 관리자 설정"
                sections={schoolAdminSections}
                activeSection={activeSection}
              />
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function SettingsMenuGroup({
  title,
  sections,
  activeSection,
}: {
  title: string;
  sections: SettingsSection[];
  activeSection: SettingsSectionId;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="px-1 text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        {title}
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
        {sections.map((section) => {
          const isActive = section.id === activeSection;

          return (
            <Button
              key={section.id}
              asChild
              variant={isActive ? "secondary" : "ghost"}
              className="h-10 shrink-0 justify-start"
            >
              <Link to={`?section=${section.id}`}>{section.label}</Link>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

function SettingsSectionPanel({
  section,
  loaderData,
  isSubmitting,
}: {
  section: SettingsSectionId;
  loaderData: Route.ComponentProps["loaderData"];
  isSubmitting: boolean;
}) {
  switch (section) {
    case "profile":
      return (
        <ProfileSection loaderData={loaderData} isSubmitting={isSubmitting} />
      );
    case "lectures":
      return (
        <LecturesSection loaderData={loaderData} isSubmitting={isSubmitting} />
      );
    case "clients":
      return (
        <ClientsSection loaderData={loaderData} isSubmitting={isSubmitting} />
      );
    case "admin-clients":
      return loaderData.admin ? (
        <AdminClientsSection
          loaderData={loaderData}
          isSubmitting={isSubmitting}
        />
      ) : null;
    case "admin-students":
      return loaderData.admin ? (
        <AdminStudentsSection
          loaderData={loaderData}
          isSubmitting={isSubmitting}
        />
      ) : null;
    case "admin-teachers":
      return loaderData.admin ? (
        <AdminTeachersSection
          loaderData={loaderData}
          isSubmitting={isSubmitting}
        />
      ) : null;
    case "admin-attendance":
      return loaderData.admin ? (
        <AdminAttendanceSection
          loaderData={loaderData}
          isSubmitting={isSubmitting}
        />
      ) : null;
    default:
      return null;
  }
}

function ProfileSection({
  loaderData,
  isSubmitting,
}: {
  loaderData: Route.ComponentProps["loaderData"];
  isSubmitting: boolean;
}) {
  return (
    <SectionCard
      title="본인 계정 정보"
      description="이메일은 표시만 하고, 이름만 수정할 수 있습니다."
    >
      <Form method="post" className="flex flex-col gap-4">
        <input type="hidden" name="intent" value="update-profile" />
        <Field label="이메일">
          <input
            value={loaderData.account.email}
            readOnly
            className={fieldClassName}
          />
        </Field>
        <Field label="이름">
          <input
            name="name"
            defaultValue={loaderData.account.name}
            className={fieldClassName}
          />
        </Field>
        <div>
          <Button type="submit" disabled={isSubmitting}>
            이름 저장
          </Button>
        </div>
      </Form>
    </SectionCard>
  );
}

function LecturesSection({
  loaderData,
  isSubmitting,
}: {
  loaderData: Route.ComponentProps["loaderData"];
  isSubmitting: boolean;
}) {
  return (
    <SectionCard
      title="등록된 수업 목록"
      description="수업을 추가하고, 각 수업별로 학생을 편집할 수 있습니다."
    >
      <div className="flex flex-col gap-6">
        <LectureEditorForm
          title="새 수업 추가"
          classrooms={loaderData.classrooms}
          semesters={loaderData.semesters}
          buttonLabel="수업 등록"
        />

        {loaderData.lectures.length === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyTitle>등록된 수업이 없습니다.</EmptyTitle>
              <EmptyDescription>
                아래 폼에서 첫 번째 수업을 등록해 주세요.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          loaderData.lectures.map((lecture) => {
            const availableStudents = loaderData.students.filter(
              (student) =>
                !lecture.students.some(({ id }) => id === student.id),
            );

            return (
              <Card
                key={lecture.id}
                size="sm"
                className="border border-border/70"
              >
                <CardHeader>
                  <CardTitle>{lecture.name || "이름 없는 수업"}</CardTitle>
                  <CardDescription>
                    모듈 {lecture.module || "미입력"} · 학생{" "}
                    {lecture.students.length}명
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-6">
                  <LectureEditorForm
                    title="수업 수정"
                    classrooms={loaderData.classrooms}
                    semesters={loaderData.semesters}
                    buttonLabel="수업 수정"
                    lecture={lecture}
                  />

                  <div className="flex flex-col gap-3">
                    <h3 className="text-sm font-medium">수업 학생 관리</h3>
                    <Form
                      method="post"
                      className="flex flex-col gap-3 rounded-xl border border-border/60 p-4"
                    >
                      <input
                        type="hidden"
                        name="intent"
                        value="add-student-to-lecture"
                      />
                      <input
                        type="hidden"
                        name="lectureId"
                        value={lecture.id}
                      />
                      <input
                        type="hidden"
                        name="semesterId"
                        value={lecture.semesterId?.toString() ?? ""}
                      />
                      <Field label="추가할 학생">
                        <select name="studentId" className={fieldClassName}>
                          {availableStudents.map((student) => (
                            <option key={student.id} value={student.id}>
                              {student.num}번 {student.name} ({student.status})
                            </option>
                          ))}
                        </select>
                      </Field>
                      <div>
                        <Button
                          type="submit"
                          disabled={
                            isSubmitting || availableStudents.length === 0
                          }
                        >
                          학생 추가
                        </Button>
                      </div>
                    </Form>

                    <div className="grid gap-3 lg:grid-cols-2">
                      {lecture.students.map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between rounded-xl border border-border/60 p-3"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {student.num}번 {student.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              상태 {student.status}
                            </p>
                          </div>
                          <Form method="post">
                            <input
                              type="hidden"
                              name="intent"
                              value="remove-student-from-lecture"
                            />
                            <input
                              type="hidden"
                              name="lectureId"
                              value={lecture.id}
                            />
                            <input
                              type="hidden"
                              name="studentId"
                              value={student.id}
                            />
                            <Button type="submit" variant="outline" size="sm">
                              제거
                            </Button>
                          </Form>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </SectionCard>
  );
}

function ClientsSection({
  loaderData,
  isSubmitting,
}: {
  loaderData: Route.ComponentProps["loaderData"];
  isSubmitting: boolean;
}) {
  return (
    <SectionCard
      title="클라이언트 등록"
      description="본인이 등록한 attendance client를 관리합니다."
    >
      <div className="flex flex-col gap-6">
        <Form
          method="post"
          className="grid gap-4 rounded-xl border border-border/70 p-4 lg:grid-cols-3"
        >
          <input type="hidden" name="intent" value="create-client" />
          <Field label="클라이언트 이름">
            <input
              name="name"
              className={fieldClassName}
              placeholder="Teacher Laptop"
            />
          </Field>
          <Field label="기본 교실">
            <select
              name="defaultClassroomId"
              className={fieldClassName}
              defaultValue=""
            >
              <option value="">선택 안 함</option>
              {loaderData.classrooms.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex items-end">
            <Button type="submit" disabled={isSubmitting}>
              내 클라이언트 등록
            </Button>
          </div>
        </Form>

        <div className="grid gap-3 lg:grid-cols-2">
          {loaderData.myClients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

function AdminClientsSection({
  loaderData,
  isSubmitting,
}: {
  loaderData: Route.ComponentProps["loaderData"];
  isSubmitting: boolean;
}) {
  return (
    <SectionCard
      title="학교 관리자 설정 · 전체 클라이언트"
      description="학교 소속 전체 클라이언트를 등록하고 비활성화합니다."
    >
      <div className="flex flex-col gap-4">
        <Form
          method="post"
          className="grid gap-4 rounded-xl border border-border/70 p-4"
        >
          <input type="hidden" name="intent" value="create-client" />
          <Field label="클라이언트 이름">
            <input name="name" className={fieldClassName} />
          </Field>
          <Field label="담당 선생님">
            <select
              name="ownerTeacherId"
              className={fieldClassName}
              defaultValue=""
            >
              <option value="">공용 클라이언트</option>
              {loaderData.admin?.teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="기본 교실">
            <select
              name="defaultClassroomId"
              className={fieldClassName}
              defaultValue=""
            >
              <option value="">선택 안 함</option>
              {loaderData.classrooms.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.name}
                </option>
              ))}
            </select>
          </Field>
          <div>
            <Button type="submit" disabled={isSubmitting}>
              학교 클라이언트 등록
            </Button>
          </div>
        </Form>

        <div className="grid gap-3">
          {loaderData.admin?.clients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

function AdminStudentsSection({
  loaderData,
  isSubmitting,
}: {
  loaderData: Route.ComponentProps["loaderData"];
  isSubmitting: boolean;
}) {
  return (
    <SectionCard
      title="학교 관리자 설정 · 학생"
      description="학생을 등록하고 재학 상태를 변경합니다."
    >
      <div className="flex flex-col gap-4">
        <Form
          method="post"
          className="grid gap-4 rounded-xl border border-border/70 p-4"
        >
          <input type="hidden" name="intent" value="create-student" />
          <Field label="이름">
            <input name="name" className={fieldClassName} />
          </Field>
          <Field label="번호">
            <input name="num" className={fieldClassName} />
          </Field>
          <Field label="기기 ID">
            <input name="deviceId" className={fieldClassName} />
          </Field>
          <div>
            <Button type="submit" disabled={isSubmitting}>
              학생 등록
            </Button>
          </div>
        </Form>

        <div className="grid gap-3">
          {loaderData.admin?.students.map((student) => (
            <Form
              key={student.id}
              method="post"
              className="grid gap-3 rounded-xl border border-border/60 p-3 lg:grid-cols-[1fr_180px_auto] lg:items-end"
            >
              <input
                type="hidden"
                name="intent"
                value="update-student-status"
              />
              <input type="hidden" name="studentId" value={student.id} />
              <div>
                <p className="text-sm font-medium">
                  {student.num}번 {student.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  기기 {student.deviceId || "미등록"}
                </p>
              </div>
              <Field label="상태">
                <select
                  name="status"
                  className={fieldClassName}
                  defaultValue={student.status}
                >
                  <option value="active">재학</option>
                  <option value="inactive">비활성</option>
                  <option value="graduated">졸업</option>
                  <option value="leave">휴학</option>
                </select>
              </Field>
              <Button type="submit" variant="outline" disabled={isSubmitting}>
                상태 저장
              </Button>
            </Form>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

function AdminTeachersSection({
  loaderData,
  isSubmitting,
}: {
  loaderData: Route.ComponentProps["loaderData"];
  isSubmitting: boolean;
}) {
  return (
    <SectionCard
      title="학교 관리자 설정 · 선생"
      description="선생 계정을 생성하고 Auth 계정을 삭제합니다."
    >
      <div className="flex flex-col gap-4">
        <Form
          method="post"
          className="grid gap-4 rounded-xl border border-border/70 p-4"
        >
          <input type="hidden" name="intent" value="create-teacher-account" />
          <Field label="이름">
            <input name="name" className={fieldClassName} />
          </Field>
          <Field label="이메일">
            <input name="email" type="email" className={fieldClassName} />
          </Field>
          <Field label="임시 비밀번호">
            <input name="password" type="password" className={fieldClassName} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isAdmin" /> 학교 관리자 권한 부여
          </label>
          <div>
            <Button type="submit" disabled={isSubmitting}>
              선생 계정 생성
            </Button>
          </div>
        </Form>

        <div className="grid gap-3">
          {loaderData.admin?.teachers.map((teacher) => (
            <div
              key={teacher.id}
              className="flex items-center justify-between rounded-xl border border-border/60 p-3"
            >
              <div>
                <p className="text-sm font-medium">{teacher.name}</p>
                <p className="text-xs text-muted-foreground">
                  {teacher.isAdmin ? "학교 관리자" : "선생님"} ·{" "}
                  {teacher.userId ? "계정 연결됨" : "계정 없음"}
                </p>
              </div>
              {teacher.userId ? (
                <Form method="post">
                  <input
                    type="hidden"
                    name="intent"
                    value="delete-teacher-account"
                  />
                  <input type="hidden" name="teacherId" value={teacher.id} />
                  <Button type="submit" variant="destructive" size="sm">
                    계정 삭제
                  </Button>
                </Form>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

function AdminAttendanceSection({
  loaderData,
  isSubmitting,
}: {
  loaderData: Route.ComponentProps["loaderData"];
  isSubmitting: boolean;
}) {
  return (
    <SectionCard
      title="학교 관리자 설정 · 공결 / 병결"
      description="학교 세션과 학생을 선택해 공결 또는 병결 처리합니다."
    >
      <Form
        method="post"
        className="grid gap-4 rounded-xl border border-border/70 p-4"
      >
        <input type="hidden" name="intent" value="mark-attendance" />
        <Field label="세션">
          <select name="lectureSessionId" className={fieldClassName}>
            {loaderData.admin?.lectureSessions.map((lectureSession) => (
              <option key={lectureSession.id} value={lectureSession.id}>
                {lectureSession.sessionDate} · {lectureSession.period}교시 ·{" "}
                {lectureSession.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="학생">
          <select name="studentId" className={fieldClassName}>
            {loaderData.admin?.students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.num}번 {student.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="출석 상태">
          <select
            name="status"
            className={fieldClassName}
            defaultValue="excused"
          >
            <option value="excused">공결</option>
            <option value="sick leave">병결</option>
          </select>
        </Field>
        <div>
          <Button type="submit" disabled={isSubmitting}>
            상태 저장
          </Button>
        </div>
      </Form>
    </SectionCard>
  );
}

function ActionNotice({
  actionData,
}: {
  actionData: TeacherSettingsActionResult;
}) {
  return (
    <Card
      className={
        actionData.ok ? "border-emerald-500/30" : "border-destructive/40"
      }
    >
      <CardHeader>
        <CardTitle>{actionData.ok ? "저장 완료" : "저장 실패"}</CardTitle>
        <CardDescription>{actionData.message}</CardDescription>
      </CardHeader>
      {actionData.token ? (
        <CardContent>
          <div className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3 font-mono text-sm">
            {actionData.token}
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
}

function LectureEditorForm({
  title,
  lecture,
  classrooms,
  semesters,
  buttonLabel,
}: {
  title: string;
  lecture?: TeacherSettingsLecture;
  classrooms: Array<{ id: string; name: string }>;
  semesters: Array<{ id: number; name: string }>;
  buttonLabel: string;
}) {
  return (
    <Form
      method="post"
      className="grid gap-4 rounded-xl border border-border/70 p-4 lg:grid-cols-2"
    >
      <input
        type="hidden"
        name="intent"
        value={lecture ? "update-lecture" : "create-lecture"}
      />
      {lecture ? (
        <input type="hidden" name="lectureId" value={lecture.id} />
      ) : null}
      <Field label={title} className="lg:col-span-2">
        <input
          name="name"
          defaultValue={lecture?.name}
          className={fieldClassName}
        />
      </Field>
      <Field label="모듈">
        <input
          name="module"
          defaultValue={lecture?.module}
          className={fieldClassName}
        />
      </Field>
      <Field label="학기">
        <select
          name="semesterId"
          className={fieldClassName}
          defaultValue={lecture?.semesterId?.toString() ?? ""}
        >
          <option value="">선택 안 함</option>
          {semesters.map((semester) => (
            <option key={semester.id} value={semester.id}>
              {semester.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="교실">
        <select
          name="classroomId"
          className={fieldClassName}
          defaultValue={lecture?.classroomId ?? ""}
        >
          <option value="">선택 안 함</option>
          {classrooms.map((classroom) => (
            <option key={classroom.id} value={classroom.id}>
              {classroom.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="수업 스케줄 JSON">
        <textarea
          name="scheduleJson"
          rows={5}
          defaultValue={JSON.stringify(lecture?.schedule ?? [], null, 2)}
          className={textareaClassName}
        />
      </Field>
      <Field label="휴일 JSON">
        <textarea
          name="holidayJson"
          rows={5}
          defaultValue={JSON.stringify(lecture?.holiday ?? [], null, 2)}
          className={textareaClassName}
        />
      </Field>
      <div className="lg:col-span-2">
        <Button type="submit">{buttonLabel}</Button>
      </div>
    </Form>
  );
}

function ClientCard({
  client,
}: {
  client: {
    id: string;
    name: string;
    active: boolean;
    defaultClassroomId?: string;
    ownerTeacherId?: string;
    lastSeenAt?: string;
  };
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/60 p-3">
      <div>
        <p className="text-sm font-medium">{client.name}</p>
        <p className="text-xs text-muted-foreground">
          {client.active ? "활성" : "비활성"}
          {client.defaultClassroomId
            ? ` · 교실 ${client.defaultClassroomId}`
            : ""}
          {client.lastSeenAt ? ` · 마지막 연결 ${client.lastSeenAt}` : ""}
        </p>
      </div>
      {client.active ? (
        <Form method="post">
          <input type="hidden" name="intent" value="deactivate-client" />
          <input type="hidden" name="clientId" value={client.id} />
          <Button type="submit" variant="outline" size="sm">
            비활성화
          </Button>
        </Form>
      ) : null}
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        className ? `flex flex-col gap-2 ${className}` : "flex flex-col gap-2"
      }
    >
      <Label>{label}</Label>
      {children}
    </div>
  );
}

const fieldClassName =
  "h-9 w-full rounded-3xl border border-input bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

const textareaClassName =
  "min-h-28 w-full rounded-3xl border border-input bg-input/30 px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";
