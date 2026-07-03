import { Link, useLocation } from "react-router";
import type { DashboardLecture } from "~/features/teacher-dashboard/dashboard";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import {
  getDateNavigationHref,
  getLectureSelectionHref,
  isLectureSelectionActive,
} from "./schedule-sidebar.helpers";

export function ScheduleSidebar({
  schedule,
  selectedDate,
  dateLabel,
  weekdayLabel,
}: {
  schedule: DashboardLecture[];
  selectedDate: string;
  dateLabel: string;
  weekdayLabel: string;
}) {
  const location = useLocation();

  return (
    <Card className="w-full lg:h-full lg:w-80 lg:shrink-0">
      <CardHeader className="pt-8 pb-1">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" aria-label="이전 날짜" asChild>
            <Link
              to={getDateNavigationHref({
                date: selectedDate,
                direction: "previous",
              })}
            >
              {"〈"}
            </Link>
          </Button>
          <p className="flex-1 text-center text-xl font-semibold [font-variant-numeric:tabular-nums]">
            {dateLabel} {weekdayLabel}
          </p>
          <Button variant="ghost" size="icon-sm" aria-label="다음 날짜" asChild>
            <Link
              to={getDateNavigationHref({
                date: selectedDate,
                direction: "next",
              })}
            >
              {"〉"}
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex flex-col gap-2">
          {schedule.map((period) => {
            const lectureId = period.id;
            const isActive = lectureId
              ? isLectureSelectionActive({
                  currentPathname: location.pathname,
                  currentSearch: location.search,
                  lectureId,
                  period: period.period,
                  selectedDate,
                })
              : false;

            if (!lectureId) {
              return (
                <div
                  key={`period-${period.period}`}
                  className="flex h-10 items-center rounded-lg px-3 text-sm text-muted-foreground"
                >
                  <span className="font-medium [font-variant-numeric:tabular-nums]">
                    {period.period}교시 -
                  </span>
                </div>
              );
            }

            return (
              <Button
                key={`${lectureId}-${period.period}`}
                asChild
                variant={isActive ? "secondary" : "ghost"}
                className="h-10 justify-between"
              >
                <Link
                  to={getLectureSelectionHref(
                    lectureId,
                    period.period,
                    selectedDate,
                  )}
                >
                  <span className="truncate text-sm font-medium [font-variant-numeric:tabular-nums]">
                    {period.period}교시 {period.name}
                  </span>
                </Link>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
