import type { Route } from "./+types/teacher.dashboard";
import { loadTeacherDashboard } from "~/features/teacher-dashboard/dashboard-loader";
import { TeacherDashboardPage } from "~/features/teacher-dashboard/dashboard-page";

export async function loader({ request }: Route.LoaderArgs) {
  return loadTeacherDashboard({ request });
}

export default function TeacherDashboard({ loaderData }: Route.ComponentProps) {
  return <TeacherDashboardPage loaderData={loaderData} />;
}
