export const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function getDayName(now: Date) {
  return days[now.getDay()];
}

export function localYYYYMMDD(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function timetzToMinutes(timetz: string) {
  const timePart = timetz.split(/[+-]/)[0];
  const [h, m] = timePart.split(":").map(Number);
  return h * 60 + m;
}
