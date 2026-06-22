import { LectureAttendancePanel } from "~/components/teacher-dashboard/lecture-attendance-panel";
import type { TeacherDashboardLoaderData } from "~/features/teacher-dashboard/dashboard-loader";

export function TeacherDashboardPanel({
  loaderData,
}: {
  loaderData: TeacherDashboardLoaderData;
}) {
  const { currentLecture, students, viewState } = loaderData;

  return (
    <LectureAttendancePanel
      viewState={viewState}
      currentLecture={currentLecture}
      students={students}
    />
  );
}
