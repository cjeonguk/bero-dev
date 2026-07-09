import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  Form,
  Link,
  data,
  redirect,
  useActionData,
  useNavigation,
  useSearchParams,
  useSubmit,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { createServiceRoleClient, createClient } from "~/lib/supabase/server";
import { handleTeacherSettingsAction } from "~/features/teacher-settings/settings-actions";
import { loadTeacherSettingsData } from "~/features/teacher-settings/settings-loader";
import type {
  LectureDay,
  LectureHolidayEntry,
  LectureScheduleEntry,
  TeacherSettingsActionResult,
  TeacherSettingsLecture,
} from "~/features/teacher-settings/settings";
import {
  lectureDays,
  parseAttendanceMarkInput,
} from "~/features/teacher-settings/settings";
import type { Route } from "./+types/teacher.settings";
import { toast } from "sonner";

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
  { id: "profile", label: "계정 정보" },
  { id: "lectures", label: "등록된 수업 목록" },
  { id: "clients", label: "클라이언트 등록" },
];

const adminSections: SettingsSection[] = [
  { id: "admin-clients", label: "교실 클라이언트", adminOnly: true },
  { id: "admin-students", label: "학생 관리", adminOnly: true },
  { id: "admin-teachers", label: "선생님 관리", adminOnly: true },
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
  const [dismissedToken, setDismissedToken] = useState<string | null>(null);
  const isSubmitting = navigation.state !== "idle";
  const sections = loaderData.admin
    ? [...baseSections, ...adminSections]
    : baseSections;
  const activeSection = getActiveSection({
    section: searchParams.get("section"),
    sections,
  });
  const token =
    actionData && "token" in actionData ? actionData.token : undefined;
  const visibleToken = token && token !== dismissedToken ? token : undefined;

  useEffect(() => {
    if (!actionData) {
      return;
    }

    if (actionData.ok) {
      toast.success(actionData.message);
    } else {
      toast.error(actionData.message);
    }
  }, [actionData]);

  return (
    <>
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 p-4 lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start lg:gap-6 lg:p-6">
        <SettingsMenu sections={sections} activeSection={activeSection} />

        <div className="flex min-w-0 flex-col gap-6">
          <SettingsSectionPanel
            section={activeSection}
            loaderData={loaderData}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
      <TokenDialog
        open={Boolean(visibleToken)}
        token={visibleToken ?? ""}
        onOpenChange={(open) =>
          setDismissedToken(open ? null : (visibleToken ?? null))
        }
      />
    </>
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
      title="계정 정보"
      description="계정 정보를 수정할 수 있습니다."
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
      description="등록한 클라이언트를 관리합니다."
    >
      <div className="flex flex-col gap-6">
        <Form
          method="post"
          className="grid gap-4 rounded-xl border border-border/70 p-4 lg:grid-cols-3"
        >
          <input type="hidden" name="intent" value="create-teacher-client" />
          <Field label="클라이언트 이름">
            <input
              name="name"
              className={fieldClassName}
              placeholder="Teacher Laptop"
            />
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
      title="학교 관리자 설정 · 교실 클라이언트"
      description="교실 클라이언트를 등록하고 비활성화합니다."
    >
      <div className="flex flex-col gap-4">
        <Form
          method="post"
          className="grid gap-4 rounded-xl border border-border/70 p-4"
        >
          <input type="hidden" name="intent" value="create-classroom-client" />
          <Field label="클라이언트 이름">
            <input name="name" className={fieldClassName} />
          </Field>
          <Field label="기본 교실">
            <ClassroomAutocomplete classrooms={loaderData.classrooms} />
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

function ClassroomAutocomplete({
  classrooms,
}: {
  classrooms: Array<{ id: string; name: string }>;
}) {
  const listboxId = useId();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const normalizedQuery = normalizeClassroomName(query);
  const filteredClassrooms = classrooms
    .filter((classroom) => {
      if (normalizedQuery === "") {
        return true;
      }

      return normalizeClassroomName(classroom.name).includes(normalizedQuery);
    })
    .slice(0, 8);

  const selectClassroom = (classroomName: string) => {
    setQuery(classroomName);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((currentIndex) => {
        if (filteredClassrooms.length === 0) {
          return -1;
        }

        return currentIndex >= filteredClassrooms.length - 1
          ? 0
          : currentIndex + 1;
      });
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((currentIndex) => {
        if (filteredClassrooms.length === 0) {
          return -1;
        }

        return currentIndex <= 0
          ? filteredClassrooms.length - 1
          : currentIndex - 1;
      });
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      selectClassroom(filteredClassrooms[activeIndex]?.name ?? query);
      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div className="relative">
      <input
        name="defaultClassroomName"
        value={query}
        className={fieldClassName}
        placeholder="예: Room A101"
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={
          activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
        }
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          setIsOpen(false);
          setActiveIndex(-1);
        }}
        onKeyDown={handleKeyDown}
      />

      {isOpen && (filteredClassrooms.length > 0 || normalizedQuery !== "") ? (
        <div
          id={listboxId}
          role="listbox"
          className="absolute top-full z-20 mt-2 w-full overflow-hidden rounded-3xl border border-border/70 bg-background/95 p-2 shadow-xl backdrop-blur-sm"
        >
          {filteredClassrooms.length > 0 ? (
            <div className="max-h-60 overflow-y-auto">
              {filteredClassrooms.map((classroom, index) => {
                const isActive = index === activeIndex;

                return (
                  <button
                    key={classroom.id}
                    id={`${listboxId}-option-${index}`}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    className={
                      isActive
                        ? "flex w-full items-center rounded-2xl bg-accent px-3 py-2 text-left text-sm text-accent-foreground"
                        : "flex w-full items-center rounded-2xl px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent/60"
                    }
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectClassroom(classroom.name)}
                  >
                    {classroom.name}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              일치하는 교실이 없습니다.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function normalizeClassroomName(name: string) {
  return name.trim().toLowerCase();
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
      title="학교 관리자 설정 · 학생 관리"
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
      title="학교 관리자 설정 · 선생님 관리"
      description="선생님 계정을 생성 혹은 삭제합니다."
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
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);

    try {
      parseAttendanceMarkInput({
        studentId: formData.get("studentId"),
        status: formData.get("status"),
        startDate: formData.get("startDate"),
        endDate: formData.get("endDate"),
        startPeriod: formData.get("startPeriod"),
        endPeriod: formData.get("endPeriod"),
      });
    } catch (error) {
      event.preventDefault();
      toast.error(
        error instanceof Error ? error.message : "입력값을 확인해 주세요.",
      );
    }
  }

  return (
    <SectionCard
      title="학교 관리자 설정 · 공결 / 병결"
      description="날짜 범위를 지정해 공결 또는 병결을 일괄 처리합니다."
    >
      <Form
        method="post"
        noValidate
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-xl border border-border/70 p-4"
      >
        <input type="hidden" name="intent" value="mark-attendance" />
        <div className="grid gap-4 sm:grid-cols-2">
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
          <div className="grid gap-4">
            <Field label="시작 날짜">
              <input
                name="startDate"
                type="date"
                className={fieldClassName}
                required
              />
            </Field>
            <Field label="종료 날짜">
              <input
                name="endDate"
                type="date"
                className={fieldClassName}
                required
              />
            </Field>
          </div>
          <div className="grid gap-4">
            <Field label="시작 교시">
              <input
                name="startPeriod"
                type="number"
                min={1}
                className={fieldClassName}
                required
              />
            </Field>
            <Field label="종료 교시">
              <input
                name="endPeriod"
                type="number"
                min={1}
                className={fieldClassName}
                required
              />
            </Field>
          </div>
        </div>
        <div>
          <Button type="submit" disabled={isSubmitting}>
            일괄 처리
          </Button>
        </div>
      </Form>
    </SectionCard>
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
  const [scheduleRows, setScheduleRows] = useState(() =>
    createLectureScheduleDrafts(lecture?.schedule),
  );
  const [holidayRows, setHolidayRows] = useState(() =>
    createLectureHolidayDrafts(lecture?.holiday),
  );
  const scheduleJsonRef = useRef<HTMLInputElement>(null);
  const holidayJsonRef = useRef<HTMLInputElement>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    try {
      const schedule = parseLectureScheduleDrafts(scheduleRows);
      const holiday = parseLectureHolidayDrafts(holidayRows);

      if (scheduleJsonRef.current) {
        scheduleJsonRef.current.value = JSON.stringify(schedule);
      }

      if (holidayJsonRef.current) {
        holidayJsonRef.current.value = JSON.stringify(holiday);
      }
    } catch (error) {
      event.preventDefault();
      toast.error(
        error instanceof Error ? error.message : "입력값을 확인해 주세요.",
      );
    }
  }

  return (
    <Form
      method="post"
      noValidate
      onSubmit={handleSubmit}
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
      <input
        ref={scheduleJsonRef}
        type="hidden"
        name="scheduleJson"
        defaultValue={JSON.stringify(lecture?.schedule ?? [])}
      />
      <input
        ref={holidayJsonRef}
        type="hidden"
        name="holidayJson"
        defaultValue={JSON.stringify(lecture?.holiday ?? [])}
      />
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
      <Field label="수업 스케줄" className="lg:col-span-2">
        <div className="flex flex-col gap-3 rounded-xl border border-border/60 p-4">
          <p className="text-xs text-muted-foreground">
            요일과 교시를 추가하면 학기 일정에 맞춰 수업 시간이 생성됩니다.
          </p>
          {scheduleRows.length === 0 ? (
            <LectureEditorEmptyState>
              등록된 수업 스케줄이 없습니다.
            </LectureEditorEmptyState>
          ) : (
            <div className="flex flex-col gap-3">
              {scheduleRows.map((row, index) => (
                <div
                  key={row.id}
                  className="grid gap-3 rounded-xl border border-border/60 p-3 sm:grid-cols-[minmax(0,1fr)_120px_auto]"
                >
                  <select
                    value={row.day}
                    aria-label={`수업 스케줄 ${index + 1}행 요일`}
                    className={fieldClassName}
                    onChange={(event) => {
                      setScheduleRows((currentRows) =>
                        currentRows.map((currentRow) =>
                          currentRow.id === row.id
                            ? { ...currentRow, day: event.target.value }
                            : currentRow,
                        ),
                      );
                    }}
                  >
                    <option value="">요일 선택</option>
                    {lectureDays.map((day) => (
                      <option key={day} value={day}>
                        {lectureDayLabels[day]}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={row.period}
                    aria-label={`수업 스케줄 ${index + 1}행 교시`}
                    className={fieldClassName}
                    placeholder="교시"
                    onChange={(event) => {
                      setScheduleRows((currentRows) =>
                        currentRows.map((currentRow) =>
                          currentRow.id === row.id
                            ? { ...currentRow, period: event.target.value }
                            : currentRow,
                        ),
                      );
                    }}
                  />
                  <div className="flex items-center justify-end sm:justify-start">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setScheduleRows((currentRows) =>
                          currentRows.filter(
                            (currentRow) => currentRow.id !== row.id,
                          ),
                        );
                      }}
                    >
                      삭제
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setScheduleRows((currentRows) => [
                  ...currentRows,
                  createEmptyLectureScheduleDraft(),
                ]);
              }}
            >
              스케줄 추가
            </Button>
          </div>
        </div>
      </Field>
      <Field label="휴일 / 제외 일정" className="lg:col-span-2">
        <div className="flex flex-col gap-3 rounded-xl border border-border/60 p-4">
          <p className="text-xs text-muted-foreground">
            특정 날짜의 교시를 제외하려면 날짜와 교시를 함께 추가해 주세요.
          </p>
          {holidayRows.length === 0 ? (
            <LectureEditorEmptyState>
              등록된 휴일이 없습니다.
            </LectureEditorEmptyState>
          ) : (
            <div className="flex flex-col gap-3">
              {holidayRows.map((row, index) => (
                <div
                  key={row.id}
                  className="grid gap-3 rounded-xl border border-border/60 p-3 sm:grid-cols-[minmax(0,1fr)_120px_auto]"
                >
                  <input
                    type="date"
                    value={row.date}
                    aria-label={`휴일 ${index + 1}행 날짜`}
                    className={fieldClassName}
                    onChange={(event) => {
                      setHolidayRows((currentRows) =>
                        currentRows.map((currentRow) =>
                          currentRow.id === row.id
                            ? { ...currentRow, date: event.target.value }
                            : currentRow,
                        ),
                      );
                    }}
                  />
                  <input
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={row.period}
                    aria-label={`휴일 ${index + 1}행 교시`}
                    className={fieldClassName}
                    placeholder="교시"
                    onChange={(event) => {
                      setHolidayRows((currentRows) =>
                        currentRows.map((currentRow) =>
                          currentRow.id === row.id
                            ? { ...currentRow, period: event.target.value }
                            : currentRow,
                        ),
                      );
                    }}
                  />
                  <div className="flex items-center justify-end sm:justify-start">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setHolidayRows((currentRows) =>
                          currentRows.filter(
                            (currentRow) => currentRow.id !== row.id,
                          ),
                        );
                      }}
                    >
                      삭제
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setHolidayRows((currentRows) => [
                  ...currentRows,
                  createEmptyLectureHolidayDraft(),
                ]);
              }}
            >
              휴일 추가
            </Button>
          </div>
        </div>
      </Field>
      <div className="lg:col-span-2">
        <Button type="submit">{buttonLabel}</Button>
      </div>
    </Form>
  );
}

type LectureScheduleDraft = {
  id: string;
  day: string;
  period: string;
};

type LectureHolidayDraft = {
  id: string;
  date: string;
  period: string;
};

const lectureDayLabels: Record<LectureDay, string> = {
  Sunday: "일요일",
  Monday: "월요일",
  Tuesday: "화요일",
  Wednesday: "수요일",
  Thursday: "목요일",
  Friday: "금요일",
  Saturday: "토요일",
};

let lectureEditorRowId = 0;

function createLectureEditorRowId() {
  lectureEditorRowId += 1;
  return `lecture-editor-row-${lectureEditorRowId}`;
}

function isLectureDayValue(value: string): value is LectureDay {
  return lectureDays.includes(value as LectureDay);
}

function createEmptyLectureScheduleDraft(): LectureScheduleDraft {
  return {
    id: createLectureEditorRowId(),
    day: "",
    period: "",
  };
}

function createEmptyLectureHolidayDraft(): LectureHolidayDraft {
  return {
    id: createLectureEditorRowId(),
    date: "",
    period: "",
  };
}

function createLectureScheduleDrafts(
  schedule: LectureScheduleEntry[] | undefined,
): LectureScheduleDraft[] {
  return (schedule ?? []).map((entry) => ({
    id: createLectureEditorRowId(),
    day: entry.day,
    period: entry.period.toString(),
  }));
}

function createLectureHolidayDrafts(
  holidays: LectureHolidayEntry[] | undefined,
): LectureHolidayDraft[] {
  return (holidays ?? []).map((entry) => ({
    id: createLectureEditorRowId(),
    date: entry.date,
    period: entry.period.toString(),
  }));
}

function parseLectureScheduleDrafts(
  rows: LectureScheduleDraft[],
): LectureScheduleEntry[] {
  const schedule: LectureScheduleEntry[] = [];
  const seenEntries = new Set<string>();

  rows.forEach((row, index) => {
    const day = row.day.trim();
    const periodValue = row.period.trim();

    if (day === "" && periodValue === "") {
      return;
    }

    if (day === "" || periodValue === "") {
      throw new Error(`수업 스케줄 ${index + 1}행을 모두 입력해 주세요.`);
    }

    if (!isLectureDayValue(day)) {
      throw new Error(
        `수업 스케줄 ${index + 1}행의 요일을 다시 선택해 주세요.`,
      );
    }

    const period = Number(periodValue);
    if (!Number.isInteger(period) || period < 1) {
      throw new Error(
        `수업 스케줄 ${index + 1}행의 교시는 1 이상의 정수여야 합니다.`,
      );
    }

    const entryKey = `${day}:${period}`;
    if (seenEntries.has(entryKey)) {
      throw new Error(`수업 스케줄 ${index + 1}행이 중복되었습니다.`);
    }

    seenEntries.add(entryKey);
    schedule.push({ day, period });
  });

  return schedule;
}

function parseLectureHolidayDrafts(
  rows: LectureHolidayDraft[],
): LectureHolidayEntry[] {
  const holidays: LectureHolidayEntry[] = [];
  const seenEntries = new Set<string>();

  rows.forEach((row, index) => {
    const date = row.date.trim();
    const periodValue = row.period.trim();

    if (date === "" && periodValue === "") {
      return;
    }

    if (date === "" || periodValue === "") {
      throw new Error(`휴일 ${index + 1}행을 모두 입력해 주세요.`);
    }

    const period = Number(periodValue);
    if (!Number.isInteger(period) || period < 1) {
      throw new Error(`휴일 ${index + 1}행의 교시는 1 이상의 정수여야 합니다.`);
    }

    const entryKey = `${date}:${period}`;
    if (seenEntries.has(entryKey)) {
      throw new Error(`휴일 ${index + 1}행이 중복되었습니다.`);
    }

    seenEntries.add(entryKey);
    holidays.push({ date, period });
  });

  return holidays;
}

function LectureEditorEmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border/60 px-4 py-5 text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function ClientCard({
  client,
}: {
  client: {
    id: string;
    name: string;
    active: boolean;
    clientType: "teacher" | "classroom";
    defaultClassroomId?: string;
    defaultClassroomName?: string;
    ownerTeacherId?: string;
    lastSeenAt?: string;
  };
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/60 p-3">
      <div>
        <p className="text-sm font-medium">{client.name}</p>
        <p className="text-xs text-muted-foreground">
          {client.clientType === "teacher" ? "선생님용" : "교실용"} ·{" "}
          {client.active ? "활성" : "비활성"}
          {client.defaultClassroomName
            ? ` · 교실 ${client.defaultClassroomName}`
            : client.defaultClassroomId
              ? ` · 교실 ${client.defaultClassroomId}`
              : ""}
          {client.lastSeenAt ? ` · 마지막 연결 ${client.lastSeenAt}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Form method="post">
          <input
            type="hidden"
            name="intent"
            value={client.active ? "deactivate-client" : "reactivate-client"}
          />
          <input type="hidden" name="clientId" value={client.id} />
          <Button type="submit" variant="outline" size="sm">
            {client.active ? "비활성화" : "재활성화"}
          </Button>
        </Form>
        <DeleteClientButton clientId={client.id} clientName={client.name} />
      </div>
    </div>
  );
}

function DeleteClientButton({
  clientId,
  clientName,
}: {
  clientId: string;
  clientName: string;
}) {
  const submit = useSubmit();

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      onClick={() => {
        if (!window.confirm(`${clientName} 클라이언트를 완전히 삭제할까요?`)) {
          return;
        }

        const formData = new FormData();
        formData.set("intent", "delete-client");
        formData.set("clientId", clientId);
        submit(formData, { method: "post" });
      }}
    >
      삭제
    </Button>
  );
}

function TokenDialog({
  open,
  token,
  onOpenChange,
}: {
  open: boolean;
  token: string;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>클라이언트 토큰 발급 완료</DialogTitle>
          <DialogDescription>
            이 토큰은 지금만 확인할 수 있습니다. 복사해서 안전한 곳에 보관해
            주세요.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3 font-mono text-sm break-all">
          {token}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              await navigator.clipboard.writeText(token);
              toast.success("토큰을 복사했습니다.");
            }}
          >
            복사
          </Button>
          <Button type="button" onClick={() => onOpenChange(false)}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
