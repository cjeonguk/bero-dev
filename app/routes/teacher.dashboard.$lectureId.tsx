import type { Route } from "./+types/teacher.dashboard.$lectureId";
import { TeacherDashboardPanel } from "~/features/teacher-dashboard/dashboard-page";
import { loadTeacherDashboardLectureDetail } from "~/features/teacher-dashboard/dashboard-loader";

export async function loader({ request, params }: Route.LoaderArgs) {
  return loadTeacherDashboardLectureDetail({
    request,
    lectureId: params.lectureId,
  });
}

export default function TeacherDashboardDetail({
  loaderData,
}: Route.ComponentProps) {
  return <TeacherDashboardPanel loaderData={loaderData} />;
}
