import { useEffect, useId, useState, type KeyboardEvent } from "react";
import { Link, useFetcher, useLocation, useNavigate } from "react-router";
import type {
  DashboardClassroomOption,
  DashboardLecture,
  DashboardLectureOption,
  DashboardStudentOption,
} from "~/features/teacher-dashboard/dashboard";
import type { DashboardSessionCreationActionResult } from "~/features/teacher-dashboard/dashboard-actions";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
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
import {
  getDateNavigationHref,
  getSessionSelectionHref,
  isSessionSelectionActive,
} from "./schedule-sidebar.helpers";

const fieldClassName =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

const textareaClassName = `${fieldClassName} min-h-24 resize-y`;

export function ScheduleSidebar({
  schedule,
  classrooms,
  students,
  teacherLectures,
  selectedDate,
  dateLabel,
  weekdayLabel,
}: {
  schedule: DashboardLecture[];
  classrooms: DashboardClassroomOption[];
  students: DashboardStudentOption[];
  teacherLectures: DashboardLectureOption[];
  selectedDate: string;
  dateLabel: string;
  weekdayLabel: string;
}) {
  const location = useLocation();
  const [selectedEmptyPeriod, setSelectedEmptyPeriod] = useState<number>();

  return (
    <>
      <Card className="w-full lg:h-full lg:w-80 lg:shrink-0">
        <CardHeader className="pt-8 pb-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="이전 날짜"
              asChild
            >
              <Link
                to={getDateNavigationHref({
                  date: selectedDate,
                  direction: "previous",
                })}
              >
                {"〈"}
              </Link>
            </Button>
            <p className="flex-1 text-center text-xl font-semibold [font-variant-numeric:tabular-nums]">
              {dateLabel} {weekdayLabel}
            </p>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="다음 날짜"
              asChild
            >
              <Link
                to={getDateNavigationHref({
                  date: selectedDate,
                  direction: "next",
                })}
              >
                {"〉"}
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-2">
            {schedule.map((period) => {
              const sessionId = period.sessionId;
              const isActive = sessionId
                ? isSessionSelectionActive({
                    currentPathname: location.pathname,
                    currentSearch: location.search,
                    sessionId,
                    selectedDate,
                  })
                : false;

              if (!sessionId) {
                return (
                  <Button
                    key={`period-${period.period}`}
                    type="button"
                    variant="ghost"
                    className="h-10 justify-start text-muted-foreground"
                    onClick={() => setSelectedEmptyPeriod(period.period)}
                  >
                    <span className="font-medium [font-variant-numeric:tabular-nums]">
                      {period.period}교시 -
                    </span>
                  </Button>
                );
              }

              return (
                <Button
                  key={sessionId}
                  asChild
                  variant={isActive ? "secondary" : "ghost"}
                  className="h-10 justify-between"
                >
                  <Link to={getSessionSelectionHref(sessionId, selectedDate)}>
                    <span className="truncate text-sm font-medium [font-variant-numeric:tabular-nums]">
                      {period.period}교시 {period.name}
                    </span>
                  </Link>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedEmptyPeriod !== undefined ? (
        <CreateManualSessionDialog
          open
          period={selectedEmptyPeriod}
          selectedDate={selectedDate}
          classrooms={classrooms}
          students={students}
          teacherLectures={teacherLectures}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedEmptyPeriod(undefined);
            }
          }}
        />
      ) : null}
    </>
  );
}

function CreateManualSessionDialog({
  open,
  period,
  selectedDate,
  classrooms,
  students,
  teacherLectures,
  onOpenChange,
}: {
  open: boolean;
  period: number | undefined;
  selectedDate: string;
  classrooms: DashboardClassroomOption[];
  students: DashboardStudentOption[];
  teacherLectures: DashboardLectureOption[];
  onOpenChange: (open: boolean) => void;
}) {
  const fetcher = useFetcher<DashboardSessionCreationActionResult>();
  const navigate = useNavigate();
  const [kind, setKind] = useState<"makeup" | "special">("makeup");
  const [selectedLectureId, setSelectedLectureId] = useState<string>(
    teacherLectures[0]?.id ?? "",
  );
  const [name, setName] = useState(teacherLectures[0]?.name ?? "");
  const [isNameDirty, setIsNameDirty] = useState(false);
  const isSubmitting = fetcher.state !== "idle";
  const selectedLecture = teacherLectures.find(
    (lecture) => lecture.id === selectedLectureId,
  );

  useEffect(() => {
    if (
      fetcher.data?.ok &&
      fetcher.data.intent === "create-manual-session" &&
      fetcher.data.sessionId
    ) {
      onOpenChange(false);
      navigate(getSessionSelectionHref(fetcher.data.sessionId, selectedDate));
    }
  }, [fetcher.data, navigate, onOpenChange, selectedDate]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {period ? `${period}교시 보강/특강 등록` : "보강/특강 등록"}
          </DialogTitle>
          <DialogDescription>
            {selectedDate} {period ? `· ${period}교시` : ""}에 등록할 세션을
            설정해 주세요.
          </DialogDescription>
        </DialogHeader>

        <fetcher.Form
          method="post"
          action={`/teacher/dashboard?date=${selectedDate}`}
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="intent" value="create-manual-session" />
          <input type="hidden" name="selectedDate" value={selectedDate} />
          <input type="hidden" name="period" value={period?.toString() ?? ""} />

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <Label htmlFor="manual-session-kind">구분</Label>
              <select
                id="manual-session-kind"
                name="kind"
                className={fieldClassName}
                value={kind}
                onChange={(event) => {
                  const nextKind =
                    event.target.value === "special" ? "special" : "makeup";
                  setKind(nextKind);
                  if (nextKind === "special" && !isNameDirty) {
                    setName("");
                  }
                  if (nextKind === "makeup" && !isNameDirty) {
                    setName(selectedLecture?.name ?? "");
                  }
                }}
              >
                <option value="makeup">보강</option>
                <option value="special">특강</option>
              </select>
            </label>

            <div className="grid gap-2">
              <Label htmlFor="manual-session-classroom">교실</Label>
              <ClassroomAutocomplete
                id="manual-session-classroom"
                classrooms={classrooms}
              />
            </div>
          </div>

          {kind === "makeup" ? (
            <label className="grid gap-2">
              <Label htmlFor="manual-session-source-lecture">원본 수업</Label>
              <select
                id="manual-session-source-lecture"
                name="sourceLectureId"
                className={fieldClassName}
                value={selectedLectureId}
                onChange={(event) => {
                  const nextLectureId = event.target.value;
                  setSelectedLectureId(nextLectureId);
                  if (!isNameDirty) {
                    const nextLecture = teacherLectures.find(
                      (lecture) => lecture.id === nextLectureId,
                    );
                    setName(nextLecture?.name ?? "");
                  }
                }}
                required
              >
                {teacherLectures.length === 0 ? (
                  <option value="">등록 가능한 원본 수업이 없습니다</option>
                ) : null}
                {teacherLectures.map((lecture) => (
                  <option key={lecture.id} value={lecture.id}>
                    {lecture.name}
                    {lecture.module ? ` (${lecture.module})` : ""}
                  </option>
                ))}
              </select>
              <p className="text-sm text-muted-foreground">
                원본 수업의 학생들은 보강 세션에 자동으로 등록됩니다.
              </p>
            </label>
          ) : null}

          <label className="grid gap-2">
            <Label htmlFor="manual-session-name">수업명</Label>
            <Input
              id="manual-session-name"
              name="name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setIsNameDirty(true);
              }}
              required
            />
          </label>

          <label className="grid gap-2">
            <Label htmlFor="manual-session-note">메모</Label>
            <textarea
              id="manual-session-note"
              name="note"
              className={textareaClassName}
              placeholder="필요한 메모가 있으면 입력해 주세요."
            />
          </label>

          {kind === "special" ? (
            <div className="grid gap-2">
              <Label>학생 등록</Label>
              <div className="grid max-h-56 gap-2 overflow-y-auto rounded-xl border border-border/60 p-3">
                {students.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    등록 가능한 학생이 없습니다.
                  </p>
                ) : (
                  students.map((student) => (
                    <label
                      key={student.id}
                      className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        name="studentIds"
                        value={student.id}
                      />
                      <span>
                        {student.num}번 {student.name} ({student.status})
                      </span>
                    </label>
                  ))
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                특강은 선택한 학생만 세션에 등록됩니다.
              </p>
            </div>
          ) : null}

          {fetcher.data && !fetcher.data.ok ? (
            <p className="text-sm text-destructive">{fetcher.data.message}</p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                (kind === "makeup" && teacherLectures.length === 0) ||
                period === undefined
              }
            >
              {isSubmitting ? "등록 중..." : "등록"}
            </Button>
          </DialogFooter>
        </fetcher.Form>
      </DialogContent>
    </Dialog>
  );
}

function ClassroomAutocomplete({
  id,
  classrooms,
}: {
  id: string;
  classrooms: DashboardClassroomOption[];
}) {
  const listboxId = useId();
  const [query, setQuery] = useState(classrooms[0]?.name ?? "");
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
        id={id}
        name="classroomName"
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
        required
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
