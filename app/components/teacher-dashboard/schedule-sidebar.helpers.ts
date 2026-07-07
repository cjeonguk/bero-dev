import { DateTime } from "luxon";

export function getSessionSelectionHref(sessionId: string, date: string) {
  return `/teacher/dashboard/${sessionId}?date=${date}`;
}

export function isSessionSelectionActive({
  currentPathname,
  currentSearch,
  sessionId,
  selectedDate,
}: {
  currentPathname: string;
  currentSearch: string;
  sessionId: string;
  selectedDate: string;
}) {
  const searchParams = new URLSearchParams(currentSearch);
  const currentDate = searchParams.get("date");

  return (
    currentPathname === `/teacher/dashboard/${sessionId}` &&
    currentDate === selectedDate
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
