export function dhakaDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function timelineClock(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}
export function timelineHour(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    hour: "numeric",
    hour12: true,
  }).format(new Date(value));
}

export function graceDuration(start?: string, end?: string) {
  if (!start || !end) return null;
  const minutes = (Date.parse(end) - Date.parse(start)) / 60_000;
  return Number.isFinite(minutes) && minutes >= 0 ? minutes : null;
}
export function nextSevenDates(today: string) {
  const start = new Date(`${today}T00:00:00+06:00`);
  return Array.from({ length: 7 }, (_, i) =>
    dhakaDate(new Date(+start + i * 86400_000)),
  );
}
export function timelinePosition(
  start: string,
  end: string,
  dayStart: string,
  dayEnd: string,
) {
  const a = Date.parse(dayStart),
    length = Date.parse(dayEnd) - a;
  return {
    left: `${Math.max(0, ((Date.parse(start) - a) / length) * 100)}%`,
    width: `${Math.max(0, ((Date.parse(end) - Date.parse(start)) / length) * 100)}%`,
  };
}

// Adjacent phases share a lane; concurrent cars and holds remain individually visible.
export function sessionLanes<T extends { startAt: string; endAt: string }>(
  segments: T[],
) {
  const ends: number[] = [];
  return [...segments]
    .sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt))
    .map((segment) => {
      const start = Date.parse(segment.startAt);
      let lane = ends.findIndex((end) => end <= start);
      if (lane < 0) lane = ends.length;
      ends[lane] = Date.parse(segment.endAt);
      return { segment, lane };
    });
}
