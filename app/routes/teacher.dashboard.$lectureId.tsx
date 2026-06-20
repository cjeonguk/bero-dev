import type { Route } from "./+types/teacher.dashboard.$lectureId";
import {
  loadTeacherDashboard,
  TeacherDashboardPage,
} from "~/features/teacher-dashboard/dashboard-page";

export async function loader({ request, params }: Route.LoaderArgs) {
  return loadTeacherDashboard({ request, lectureId: params.lectureId });
}

export default function TeacherDashboardDetail({
  loaderData,
}: Route.ComponentProps) {
  return <TeacherDashboardPage loaderData={loaderData} />;
}
