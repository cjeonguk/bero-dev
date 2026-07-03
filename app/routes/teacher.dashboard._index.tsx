import { Navigate, useOutletContext } from "react-router";
import { TeacherDashboardPanel } from "~/features/teacher-dashboard/dashboard-page";
import type { DashboardLecture } from "~/features/teacher-dashboard/dashboard";
import type { TeacherDashboardOutletContext } from "~/routes/teacher.dashboard";

export function getTeacherDashboardIndexRedirectHref(
  schedule: DashboardLecture[],
  selectedDate: string,
) {
  const firstLecture = schedule.find((lecture) => lecture.id);

  if (!firstLecture?.id) {
    return undefined;
  }

  return `/teacher/dashboard/${firstLecture.id}?date=${selectedDate}&period=${firstLecture.period}`;
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

  return <TeacherDashboardPanel loaderData={loaderData} />;
}
