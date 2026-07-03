import { DateTime } from "luxon";

export function getLectureSelectionHref(
  lectureId: string,
  period: number,
  date: string,
) {
  return `/teacher/dashboard/${lectureId}?date=${date}&period=${period}`;
}

export function isLectureSelectionActive({
  currentPathname,
  currentSearch,
  lectureId,
  period,
  selectedDate,
}: {
  currentPathname: string;
  currentSearch: string;
  lectureId: string;
  period: number;
  selectedDate: string;
}) {
  const searchParams = new URLSearchParams(currentSearch);
  const currentPeriod = Number(searchParams.get("period"));
  const currentDate = searchParams.get("date");

  return (
    currentPathname === `/teacher/dashboard/${lectureId}` &&
    currentDate === selectedDate &&
    currentPeriod === period
  );
}

export function getDateNavigationHref({
  date,
  direction,
}: {
  date: string;
  direction: "previous" | "next";
}) {
  const nextDate = DateTime.fromISO(date, { zone: "Asia/Seoul" })
    .plus({ days: direction === "previous" ? -1 : 1 })
    .toFormat("yyyy-MM-dd");

  return `/teacher/dashboard?date=${nextDate}`;
}
