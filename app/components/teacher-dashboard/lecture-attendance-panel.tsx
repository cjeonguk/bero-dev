import type { Database } from "~/types/database.types";
import type {
  DashboardLecture,
  DashboardStudentAttendance,
  DashboardViewState,
} from "~/features/teacher-dashboard/dashboard";
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
import { Separator } from "~/components/ui/separator";
import { cn } from "~/lib/utils";

export function LectureAttendancePanel({
  viewState,
  currentLecture,
  students,
}: {
  viewState: DashboardViewState;
  currentLecture: DashboardLecture | undefined;
  students: DashboardStudentAttendance[];
}) {
  const presentCount = students.filter(
    (student) => student.attendance === "present",
  ).length;
  const emptyState = getDashboardEmptyState(viewState);

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
        <CardDescription>
          {currentLecture?.module ? `${currentLecture.module} | ` : ""}
          {currentLecture?.period}교시 수업
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
    </Card>
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
