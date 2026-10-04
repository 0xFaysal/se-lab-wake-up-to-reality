export function dhakaToday(now = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
}

export function defaultSearchWindow(now = new Date()) {
  let date = dhakaToday(now);
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dhaka", hour: "2-digit", hourCycle: "h23" }).format(now));
  const startHour = hour + 1;
  if (startHour >= 22) {
    const nextDate = new Date(`${date}T00:00:00Z`);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    date = nextDate.toISOString().slice(0, 10);
    return { date, startTime: "09:00", endTime: "12:00" };
  }
  return { date, startTime: `${String(startHour).padStart(2, "0")}:00`,
    endTime: `${String(Math.min(startHour + 3, 23)).padStart(2, "0")}:00` };
}
