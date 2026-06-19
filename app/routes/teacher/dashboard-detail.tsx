import type { Route } from "./+types/dashboard-detail";
import { loadTeacherDashboard, TeacherDashboardPage } from "./dashboard-page";

export async function loader({ request, params }: Route.LoaderArgs) {
  return loadTeacherDashboard({ request, lectureId: params.lectureId });
}

export default function TeacherDashboardDetail({
  loaderData,
}: Route.ComponentProps) {
  return <TeacherDashboardPage loaderData={loaderData} />;
}
