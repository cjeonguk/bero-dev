import { Navigate, useOutletContext } from "react-router";
import { TeacherDashboardPanel } from "~/features/teacher-dashboard/dashboard-page";
import type { DashboardLecture } from "~/features/teacher-dashboard/dashboard";
import type { TeacherDashboardOutletContext } from "~/routes/teacher.dashboard";

export function getTeacherDashboardIndexRedirectHref(
  currentLecture: DashboardLecture | undefined,
) {
  if (!currentLecture?.id) {
    return undefined;
  }

  return `/teacher/dashboard/${currentLecture.id}?period=${currentLecture.period}`;
}

export default function TeacherDashboardIndex() {
  const loaderData = useOutletContext<TeacherDashboardOutletContext>();
  const redirectHref = getTeacherDashboardIndexRedirectHref(
    loaderData.currentLecture,
  );

  if (redirectHref) {
    return <Navigate to={redirectHref} replace />;
  }

  return <TeacherDashboardPanel loaderData={loaderData} />;
}
