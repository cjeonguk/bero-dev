import { useOutletContext } from "react-router";
import { TeacherDashboardPanel } from "~/features/teacher-dashboard/dashboard-page";
import type { TeacherDashboardOutletContext } from "~/routes/teacher.dashboard";

export default function TeacherDashboardIndex() {
  const loaderData = useOutletContext<TeacherDashboardOutletContext>();

  return <TeacherDashboardPanel loaderData={loaderData} />;
}
