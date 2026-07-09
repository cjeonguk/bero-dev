import type { Route } from "./+types/teacher.dashboard.$sessionId";
import { data, redirect } from "react-router";
import { handleTeacherDashboardAction } from "~/features/teacher-dashboard/dashboard-actions";
import { TeacherDashboardPanel } from "~/features/teacher-dashboard/dashboard-page";
import { loadTeacherDashboardLectureDetail } from "~/features/teacher-dashboard/dashboard-loader";
import { createClient } from "~/lib/supabase/server";

export async function loader({ request, params }: Route.LoaderArgs) {
  return loadTeacherDashboardLectureDetail({
    request,
    sessionId: params.sessionId,
  });
}

export async function action({ request, params }: Route.ActionArgs) {
  const { supabase, headers } = createClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login", { headers });
  }

  try {
    return data(
      await handleTeacherDashboardAction({
        request,
        supabase,
        userId: user.id,
        sessionId: params.sessionId,
      }),
      { headers },
    );
  } catch (error) {
    return data(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "출석 저장 중 오류가 발생했습니다.",
        intent: "update-attendances",
      },
      { headers, status: 400 },
    );
  }
}

export default function TeacherDashboardDetail({
  loaderData,
}: Route.ComponentProps) {
  return <TeacherDashboardPanel loaderData={loaderData} />;
}
