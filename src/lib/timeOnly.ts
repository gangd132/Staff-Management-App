export function isValidHalfHourTimeString(value: string) {
  // "HH:MM" 24시간제, 분은 00 또는 30만 허용
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) return false;
  const minutes = Number(match[2]);
  return minutes === 0 || minutes === 30;
}

export function timeStringToDate(value: string) {
  if (!isValidHalfHourTimeString(value)) {
    throw new Error("시간 형식이 올바르지 않습니다. (예: 09:00, 09:30)");
  }
  return new Date(`1970-01-01T${value}:00.000Z`);
}

export function dateToTimeString(value: Date) {
  const hh = String(value.getUTCHours()).padStart(2, "0");
  const mm = String(value.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function buildHalfHourOptions() {
  const options: string[] = [];
  for (let h = 0; h < 24; h += 1) {
    for (const m of [0, 30] as const) {
      options.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return options;
}

export function timeStringToMinutes(value: string) {
  if (!isValidHalfHourTimeString(value)) {
    throw new Error("시간 형식이 올바르지 않습니다. (예: 09:00, 09:30)");
  }
  const [hh, mm] = value.split(":").map(Number);
  return hh * 60 + mm;
}

export function calculateHoursWorked(startTime: string, endTime: string) {
  const startMinutes = timeStringToMinutes(startTime);
  const endMinutes = timeStringToMinutes(endTime);
  if (endMinutes <= startMinutes) {
    throw new Error("퇴근시간은 출근시간 이후여야 합니다.");
  }
  const diffMinutes = endMinutes - startMinutes;
  // 30분 단위 입력이므로 30으로 나누어떨어져야 함
  if (diffMinutes % 30 !== 0) {
    throw new Error("근무시간은 30분 단위로만 계산됩니다.");
  }
  return diffMinutes / 60;
}

