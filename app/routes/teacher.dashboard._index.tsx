import { Navigate, useOutletContext } from "react-router";
import { TeacherDashboardPanel } from "~/features/teacher-dashboard/dashboard-page";
import type { DashboardLecture } from "~/features/teacher-dashboard/dashboard";
import type { TeacherDashboardOutletContext } from "~/routes/teacher.dashboard";

export function getTeacherDashboardIndexRedirectHref(
  schedule: DashboardLecture[],
  selectedDate: string,
) {
  const firstLecture = schedule.find((lecture) => lecture.sessionId);

  if (!firstLecture?.sessionId) {
    return undefined;
  }

  return `/teacher/dashboard/${firstLecture.sessionId}?date=${selectedDate}`;
}

export default function TeacherDashboardIndex() {
  const loaderData = useOutletContext<TeacherDashboardOutletContext>();
  const redirectHref = getTeacherDashboardIndexRedirectHref(
    loaderData.schedule,
    loaderData.selectedDate,
  );

  if (redirectHref) {
    return <Navigate to={redirectHref} replace />;
  }

  return (
    <TeacherDashboardPanel
      loaderData={{
        currentLecture: loaderData.currentLecture,
        classrooms: loaderData.classrooms,
        students: [],
        viewState: loaderData.viewState,
      }}
    />
  );
}
