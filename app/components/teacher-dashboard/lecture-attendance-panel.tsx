import { useEffect, useState } from "react";
import { Navigate, useFetcher, useLocation, useNavigate } from "react-router";
import type { Database } from "~/types/database.types";
import type {
  DashboardSessionDeleteActionResult,
  DashboardSessionUpdateActionResult,
} from "~/features/teacher-dashboard/dashboard-actions";
import type {
  DashboardClassroomOption,
  DashboardLecture,
  DashboardStudentAttendance,
  DashboardViewState,
} from "~/features/teacher-dashboard/dashboard";
import { ClassroomAutocomplete } from "~/components/teacher-dashboard/classroom-autocomplete";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardAction,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { cn } from "~/lib/utils";

const attendanceOptions = [
  { value: "present", label: "출석" },
  { value: "absent", label: "결석" },
  { value: "late", label: "지각" },
  { value: "excused", label: "공결" },
  { value: "sick leave", label: "병결" },
] satisfies Array<{
  value: Database["public"]["Enums"]["attendance_status"];
  label: string;
}>;

const attendanceFieldClassName =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function LectureAttendancePanel({
  viewState,
  currentLecture,
  students,
  classrooms,
}: {
  viewState: DashboardViewState;
  currentLecture: DashboardLecture | undefined;
  students: DashboardStudentAttendance[];
  classrooms: DashboardClassroomOption[];
}) {
  const updateFetcher = useFetcher<DashboardSessionUpdateActionResult>();
  const deleteFetcher = useFetcher<DashboardSessionDeleteActionResult>();
  const location = useLocation();
  const navigate = useNavigate();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const presentCount = students.filter(
    (student) => student.attendance === "present",
  ).length;
  const lectureSummaryItems = [
    currentLecture?.module,
    currentLecture?.period ? `${currentLecture.period}교시 수업` : undefined,
    currentLecture?.classroomName,
  ].filter((item): item is string => Boolean(item));
  const emptyState = getDashboardEmptyState(viewState);
  const isSaving = updateFetcher.state !== "idle";
  const isDeleting = deleteFetcher.state !== "idle";
  const selectedDate = new URLSearchParams(location.search).get("date");
  const deleteRedirectHref = selectedDate
    ? `/teacher/dashboard?date=${selectedDate}`
    : "/teacher/dashboard";
  const deleteSuccessData =
    deleteFetcher.data?.ok && deleteFetcher.data.intent === "delete-session"
      ? deleteFetcher.data
      : undefined;
  const editFormKey = [
    currentLecture?.sessionId,
    currentLecture?.module ?? "",
    currentLecture?.classroomName ?? "",
    currentLecture?.note ?? "",
    students.map((student) => `${student.id}:${student.attendance}`).join("|"),
  ].join("::");

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsEditDialogOpen(false);
      setIsDeleteDialogOpen(false);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [currentLecture?.sessionId]);

  useEffect(() => {
    if (
      updateFetcher.data?.ok &&
      updateFetcher.data.intent === "update-session"
    ) {
      const timeoutId = setTimeout(() => {
        setIsEditDialogOpen(false);
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [updateFetcher.data]);

  useEffect(() => {
    if (deleteSuccessData) {
      const timeoutId = setTimeout(() => {
        setIsDeleteDialogOpen(false);
        navigate(deleteSuccessData.redirectTo ?? deleteRedirectHref, {
          replace: true,
        });
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [deleteRedirectHref, deleteSuccessData, navigate]);

  if (deleteSuccessData) {
    return (
      <Navigate
        to={deleteSuccessData.redirectTo ?? deleteRedirectHref}
        replace
      />
    );
  }

  if (viewState !== "active-lecture") {
    return (
      <Card className="flex h-full min-h-[360px] flex-col">
        <CardContent className="flex h-full items-center justify-center">
          <Empty className="max-w-lg border">
            <EmptyHeader>
              <EmptyTitle>{emptyState.title}</EmptyTitle>
              <EmptyDescription>{emptyState.description}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex h-full min-h-0 flex-col">
      <CardHeader>
        <CardTitle className="text-2xl">{currentLecture?.name}</CardTitle>
        <CardDescription className="flex min-w-0 items-center gap-1">
          {lectureSummaryItems.map((item, index) => (
            <span key={`${item}-${index}`} className="shrink-0">
              {index > 0 ? "| " : ""}
              {item}
            </span>
          ))}
          {currentLecture?.note ? (
            <>
              {lectureSummaryItems.length > 0 ? (
                <span className="shrink-0">|</span>
              ) : null}
              <span className="min-w-0 truncate">{currentLecture.note}</span>
            </>
          ) : null}
        </CardDescription>
        <CardAction className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditDialogOpen(true)}
            >
              수정
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              삭제
            </Button>
          </div>
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
                현재 수업에 등록된 학생이 없어 출결을 표시할 수 없습니다.
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
                  className={cn("py-4", attendancePresentation.cardClassName)}
                  size="sm"
                >
                  <CardContent className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-lg font-semibold">
                        {student.name}
                      </p>
                      <Badge variant={attendancePresentation.badgeVariant}>
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
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>세션 수정</DialogTitle>
            <DialogDescription>
              세션 정보와 학생별 출석 상태를 변경한 뒤 저장해 주세요.
            </DialogDescription>
          </DialogHeader>
          <updateFetcher.Form
            key={editFormKey}
            method="post"
            className="grid gap-4"
          >
            <input type="hidden" name="intent" value="update-session" />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2">
                <Label htmlFor="session-module">모듈</Label>
                <Input
                  id="session-module"
                  name="module"
                  defaultValue={currentLecture?.module ?? ""}
                  placeholder="모듈을 입력해 주세요."
                  disabled={isSaving}
                />
              </label>

              <div className="grid gap-2">
                <Label htmlFor="session-classroom">교실</Label>
                <ClassroomAutocomplete
                  id="session-classroom"
                  classrooms={classrooms}
                  defaultValue={currentLecture?.classroomName}
                  required
                  disabled={isSaving}
                />
              </div>
            </div>

            <label className="grid gap-2">
              <Label htmlFor="session-note">메모</Label>
              <textarea
                id="session-note"
                name="note"
                defaultValue={currentLecture?.note ?? ""}
                className={attendanceFieldClassName}
                placeholder="필요한 메모가 있으면 입력해 주세요."
                disabled={isSaving}
              />
            </label>

            <div className="grid gap-2">
              <div>
                <p className="text-sm font-medium">학생 출석 상태</p>
                <p className="text-sm text-muted-foreground">
                  {students.length === 0
                    ? "등록된 학생이 없어 세션 정보만 수정할 수 있습니다."
                    : "학생별 출석 상태를 함께 저장할 수 있습니다."}
                </p>
              </div>
              <AttendanceEditFields students={students} disabled={isSaving} />
            </div>

            {updateFetcher.data && !updateFetcher.data.ok ? (
              <p className="text-sm text-destructive">
                {updateFetcher.data.message}
              </p>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isSaving || isDeleting}
              >
                취소
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "저장 중..." : "저장"}
              </Button>
            </DialogFooter>
          </updateFetcher.Form>
        </DialogContent>
      </Dialog>
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>세션 삭제</DialogTitle>
            <DialogDescription>
              {currentLecture?.name} 세션을 삭제하시겠습니까? 이 작업은 되돌릴
              수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <deleteFetcher.Form method="post" className="grid gap-4">
            <input type="hidden" name="intent" value="delete-session" />
            {deleteFetcher.data && !deleteFetcher.data.ok ? (
              <p className="text-sm text-destructive">
                {deleteFetcher.data.message}
              </p>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeleting}
              >
                취소
              </Button>
              <Button type="submit" variant="destructive" disabled={isDeleting}>
                {isDeleting ? "삭제 중..." : "삭제"}
              </Button>
            </DialogFooter>
          </deleteFetcher.Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export function AttendanceEditFields({
  students,
  disabled,
}: {
  students: DashboardStudentAttendance[];
  disabled?: boolean;
}) {
  if (students.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 px-3 py-4 text-sm text-muted-foreground">
        등록된 학생이 없습니다.
      </div>
    );
  }

  return (
    <div className="grid max-h-[50vh] gap-3 overflow-y-auto pr-1">
      {students.map((student) => (
        <label
          key={student.id}
          className="grid gap-2 rounded-xl border border-border/60 p-3"
        >
          <span className="text-sm font-medium">
            {student.num}번 {student.name}
          </span>
          <select
            name={`attendance:${student.id}`}
            defaultValue={student.attendance}
            className={attendanceFieldClassName}
            disabled={disabled}
          >
            {attendanceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}

function getDashboardEmptyState(viewState: DashboardViewState) {
  if (viewState === "no-semester") {
    return {
      title: "현재 진행 중인 학기가 없습니다",
      description: "학기 일정이 등록되었는지 확인해 주세요.",
    };
  }

  if (viewState === "day-finished") {
    return {
      title: "오늘 수업이 모두 종료되었습니다",
      description: "지난 수업을 보려면 왼쪽 시간표에서 선택하세요.",
    };
  }

  return {
    title: "선택된 수업이 없습니다",
    description:
      "왼쪽 시간표에서 수업을 선택하면 학생 출결 현황을 볼 수 있습니다.",
  };
}

function getAttendancePresentation(
  attendance: Database["public"]["Enums"]["attendance_status"],
) {
  const matchedOption = attendanceOptions.find(
    (option) => option.value === attendance,
  );

  if (attendance === "present") {
    return {
      label: matchedOption?.label ?? "출석",
      badgeVariant: "default" as const,
      cardClassName: "border-primary/30 bg-primary/5",
    };
  }

  if (attendance === "absent") {
    return {
      label: matchedOption?.label ?? "결석",
      badgeVariant: "destructive" as const,
      cardClassName: "border-destructive/30 bg-destructive/5",
    };
  }

  if (attendance === "late") {
    return {
      label: matchedOption?.label ?? "지각",
      badgeVariant: "secondary" as const,
      cardClassName: "border-border bg-muted/40",
    };
  }

  if (attendance === "excused") {
    return {
      label: matchedOption?.label ?? "공결",
      badgeVariant: "secondary" as const,
      cardClassName: "border-border bg-muted/40",
    };
  }

  return {
    label: matchedOption?.label ?? "병결",
    badgeVariant: "secondary" as const,
    cardClassName: "border-border bg-muted/40",
  };
}
