import { LectureAttendancePanel } from "~/components/teacher-dashboard/lecture-attendance-panel";
import type {
  TeacherDashboardLectureDetailLoaderData,
  TeacherDashboardShellLoaderData,
} from "~/features/teacher-dashboard/dashboard-loader";

type TeacherDashboardPanelData = Pick<
  TeacherDashboardShellLoaderData,
  "currentLecture" | "viewState" | "classrooms"
> &
  Pick<TeacherDashboardLectureDetailLoaderData, "students">;

export function TeacherDashboardPanel({
  loaderData,
}: {
  loaderData: TeacherDashboardPanelData;
}) {
  const { currentLecture, students, viewState, classrooms } = loaderData;

  return (
    <LectureAttendancePanel
      viewState={viewState}
      currentLecture={currentLecture}
      students={students}
      classrooms={classrooms}
    />
  );
}
