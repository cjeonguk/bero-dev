import type { Route } from "./+types/teacher.dashboard";
import { Outlet } from "react-router";
import { ScheduleSidebar } from "~/components/teacher-dashboard/schedule-sidebar";
import { loadTeacherDashboard } from "~/features/teacher-dashboard/dashboard-loader";
import type { TeacherDashboardLoaderData } from "~/features/teacher-dashboard/dashboard-loader";

export type TeacherDashboardOutletContext = TeacherDashboardLoaderData;

export async function loader({ request, params }: Route.LoaderArgs) {
  return loadTeacherDashboard({ request, lectureId: params.lectureId });
}

export default function TeacherDashboard({ loaderData }: Route.ComponentProps) {
  const { schedule, currentLecture, selectedDate, dateLabel, weekdayLabel } =
    loaderData;

  return (
    <div className="flex min-h-full flex-1 w-full bg-muted/30">
      <div className="mx-auto flex min-h-full w-full max-w-[1400px] flex-col gap-4 p-4 lg:flex-row lg:items-stretch lg:gap-6 lg:p-6">
        <ScheduleSidebar
          schedule={schedule}
          currentLecture={currentLecture}
          selectedDate={selectedDate}
          dateLabel={dateLabel}
          weekdayLabel={weekdayLabel}
        />

        <div className="min-h-0 flex-1 lg:h-full">
          <Outlet
            context={loaderData satisfies TeacherDashboardOutletContext}
          />
        </div>
      </div>
    </div>
  );
}
