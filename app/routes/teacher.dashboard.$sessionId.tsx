import type { Route } from "./+types/teacher.dashboard.$sessionId";
import { data, redirect, useOutletContext } from "react-router";
import { handleTeacherDashboardAction } from "~/features/teacher-dashboard/dashboard-actions";
import { TeacherDashboardPanel } from "~/features/teacher-dashboard/dashboard-page";
import { loadTeacherDashboardLectureDetail } from "~/features/teacher-dashboard/dashboard-loader";
import { createClient, createServiceRoleClient } from "~/lib/supabase/server";
import type { TeacherDashboardOutletContext } from "~/routes/teacher.dashboard";

async function getActionIntent(request: Request) {
  const formData = await request.clone().formData();
  const intent = formData.get("intent");

  return typeof intent === "string" ? intent : undefined;
}

export async function loader({ request, params }: Route.LoaderArgs) {
  return loadTeacherDashboardLectureDetail({
    request,
    sessionId: params.sessionId,
  });
}

export async function action({ request, params }: Route.ActionArgs) {
  const intent = await getActionIntent(request);
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
        serviceRoleSupabase: createServiceRoleClient(),
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
            : intent === "delete-session"
              ? "세션 삭제 중 오류가 발생했습니다."
              : intent === "update-session"
                ? "세션 수정 중 오류가 발생했습니다."
                : "출석 저장 중 오류가 발생했습니다.",
        intent:
          intent === "delete-session"
            ? "delete-session"
            : intent === "update-session"
              ? "update-session"
              : "update-attendances",
      },
      { headers, status: 400 },
    );
  }
}

export default function TeacherDashboardDetail({
  loaderData,
}: Route.ComponentProps) {
  const shellData = useOutletContext<TeacherDashboardOutletContext>();

  return (
    <TeacherDashboardPanel
      loaderData={{
        ...loaderData,
        classrooms: shellData.classrooms,
      }}
    />
  );
}
