import type { Route } from "./+types/dashboard";
import { loadTeacherDashboard, TeacherDashboardPage } from "./dashboard-page";

export async function loader({ request }: Route.LoaderArgs) {
  return loadTeacherDashboard({ request });
}

export default function TeacherDashboard({ loaderData }: Route.ComponentProps) {
  return <TeacherDashboardPage loaderData={loaderData} />;
}
