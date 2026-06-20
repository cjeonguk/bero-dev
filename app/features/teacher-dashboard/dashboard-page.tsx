import { ScheduleSidebar } from "~/components/teacher-dashboard/schedule-sidebar";
import { LectureAttendancePanel } from "~/components/teacher-dashboard/lecture-attendance-panel";
import type { TeacherDashboardLoaderData } from "~/features/teacher-dashboard/dashboard-loader";

export function TeacherDashboardPage({
  loaderData,
}: {
  loaderData: TeacherDashboardLoaderData;
}) {
  const {
    schedule,
    currentLecture,
    students,
    dateLabel,
    weekdayLabel,
    viewState,
  } = loaderData;

  return (
    <div className="flex min-h-full flex-1 w-full bg-muted/30">
      <div className="mx-auto flex min-h-full w-full max-w-[1400px] flex-col gap-4 p-4 lg:flex-row lg:items-stretch lg:gap-6 lg:p-6">
        <ScheduleSidebar
          schedule={schedule}
          currentLecture={currentLecture}
          dateLabel={dateLabel}
          weekdayLabel={weekdayLabel}
        />

        <div className="min-h-0 flex-1 lg:h-full">
          <LectureAttendancePanel
            viewState={viewState}
            currentLecture={currentLecture}
            students={students}
          />
        </div>
      </div>
    </div>
  );
}
