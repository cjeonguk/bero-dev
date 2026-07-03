import { DateTime } from "luxon";

export function getLectureSelectionHref(
  lectureId: string,
  period: number,
  date: string,
) {
  return `/teacher/dashboard/${lectureId}?date=${date}&period=${period}`;
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
