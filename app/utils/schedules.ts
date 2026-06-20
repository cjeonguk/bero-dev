import { timetzToMinutes } from "~/utils/dates";

export type LectureScheduleEntry = {
  day: string;
  period: number;
};

export type PeriodScheduleEntry = {
  period: number;
  start_time: string;
  end_time: string;
};

export function getCurrentPeriod(
  periodSchedules: PeriodScheduleEntry[],
  nowMinutes: number,
) {
  return periodSchedules.find(({ start_time, end_time }) => {
    const startMinutes = timetzToMinutes(start_time);
    const endMinutes = timetzToMinutes(end_time);
    return nowMinutes >= startMinutes && nowMinutes < endMinutes;
  })?.period;
}
