import type { Route } from "./+types/teacher.dashboard";
import {
  data,
  Outlet,
  redirect,
  type ShouldRevalidateFunctionArgs,
} from "react-router";
import { ScheduleSidebar } from "~/components/teacher-dashboard/schedule-sidebar";
import {
  handleTeacherDashboardAction,
  type TeacherDashboardActionResult,
} from "~/features/teacher-dashboard/dashboard-actions";
import {
  loadTeacherDashboardShell,
  type TeacherDashboardShellLoaderData,
} from "~/features/teacher-dashboard/dashboard-loader";
import { createServiceRoleClient, createClient } from "~/lib/supabase/server";

async function getActionIntent(request: Request) {
  const formData = await request.clone().formData();
  const intent = formData.get("intent");

  return typeof intent === "string" ? intent : undefined;
}

export type TeacherDashboardOutletContext = TeacherDashboardShellLoaderData;

export function shouldRevalidateTeacherDashboardShell({
  currentUrl,
  nextUrl,
  formMethod,
  actionResult,
  defaultShouldRevalidate,
}: Pick<
  ShouldRevalidateFunctionArgs,
  | "currentUrl"
  | "nextUrl"
  | "formMethod"
  | "actionResult"
  | "defaultShouldRevalidate"
>) {
  if (formMethod || actionResult !== undefined) {
    return defaultShouldRevalidate;
  }

  const currentDate = currentUrl.searchParams.get("date");
  const nextDate = nextUrl.searchParams.get("date");
  const currentPathSegments = currentUrl.pathname.split("/").filter(Boolean);
  const nextPathSegments = nextUrl.pathname.split("/").filter(Boolean);
  const isTeacherDashboardPath = (segments: string[]) =>
    segments[0] === "teacher" && segments[1] === "dashboard";
  const isTeacherDashboardDetailPath = (segments: string[]) =>
    isTeacherDashboardPath(segments) && segments.length === 3;
  const detailPathChanged =
    isTeacherDashboardDetailPath(currentPathSegments) &&
    isTeacherDashboardDetailPath(nextPathSegments) &&
    currentUrl.pathname !== nextUrl.pathname;

  if (detailPathChanged && currentDate === nextDate) {
    return false;
  }

  return defaultShouldRevalidate;
}

export async function loader({ request, params }: Route.LoaderArgs) {
  return loadTeacherDashboardShell({ request, sessionId: params.sessionId });
}

export async function action({ request }: Route.ActionArgs) {
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
            : "세션 처리 중 오류가 발생했습니다.",
        intent:
          intent === "create-manual-session"
            ? "create-manual-session"
            : "update-attendances",
      } satisfies TeacherDashboardActionResult,
      { headers, status: 400 },
    );
  }
}

export function shouldRevalidate(args: ShouldRevalidateFunctionArgs) {
  return shouldRevalidateTeacherDashboardShell(args);
}

export default function TeacherDashboard({ loaderData }: Route.ComponentProps) {
  const {
    schedule,
    classrooms,
    students,
    teacherLectures,
    selectedDate,
    dateLabel,
    weekdayLabel,
  } = loaderData;

  return (
    <div className="flex min-h-full flex-1 w-full bg-muted/30">
      <div className="mx-auto flex min-h-full w-full max-w-[1400px] flex-col gap-4 p-4 lg:flex-row lg:items-stretch lg:gap-6 lg:p-6">
        <ScheduleSidebar
          schedule={schedule}
          classrooms={classrooms}
          students={students}
          teacherLectures={teacherLectures}
          selectedDate={selectedDate}
          dateLabel={dateLabel}
          weekdayLabel={weekdayLabel}
        />

        <div className="min-h-0 flex-1 lg:h-full">
          <Outlet
            context={loaderData satisfies TeacherDashboardOutletContext}
          />
        </div>
      </div>
    </div>
  );
}
