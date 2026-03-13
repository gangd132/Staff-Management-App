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

/** 하루 기준 분 수 (24 * 60) */
const MINUTES_PER_DAY = 24 * 60;

/** 4시간 이상 ~ 8시간 미만 근무 시 공제되는 휴게시간(시간 단위) */
const BREAK_HOURS_WHEN_4H_OR_MORE = 0.5;
/** 8시간 이상 근무 시 공제되는 휴게시간(시간 단위) */
const BREAK_HOURS_WHEN_8H_OR_MORE = 1;

/**
 * 출근~퇴근 순수 근무시간(시간 단위) 계산. 휴게 공제 없음.
 * 퇴근이 출근보다 이전이면 자정을 넘기는 근무로 간주하여 다음날 퇴근으로 계산합니다.
 */
export function calculateHoursWorkedRaw(startTime: string, endTime: string) {
  const startMinutes = timeStringToMinutes(startTime);
  let endMinutes = timeStringToMinutes(endTime);
  if (endMinutes <= startMinutes) {
    endMinutes += MINUTES_PER_DAY;
  }
  const diffMinutes = endMinutes - startMinutes;
  if (diffMinutes % 30 !== 0) {
    throw new Error("근무시간은 30분 단위로만 계산됩니다.");
  }
  return diffMinutes / 60;
}

/**
 * 출근~퇴근 근무시간(시간 단위) 계산. 휴게 공제 적용.
 * 퇴근이 출근보다 이전이면 자정을 넘기는 근무(예: 18:00 출근 ~ 02:00 퇴근)로 간주하여 다음날 퇴근으로 계산합니다.
 * 휴게 공제: 4시간 이상 시 0.5시간, 8시간 이상 시 1시간 공제한 값을 반환합니다.
 */
export function calculateHoursWorked(startTime: string, endTime: string) {
  let hours = calculateHoursWorkedRaw(startTime, endTime);
  if (hours >= 8) {
    hours -= BREAK_HOURS_WHEN_8H_OR_MORE;
  } else if (hours >= 4) {
    hours -= BREAK_HOURS_WHEN_4H_OR_MORE;
  }
  return hours;
}

/**
 * autoBreakDeduction 설정에 따라 휴게 공제를 적용하거나 적용하지 않고 근무시간을 계산합니다.
 */
export function calculateHoursWorkedWithSetting(
  startTime: string,
  endTime: string,
  autoBreakDeduction: boolean
) {
  return autoBreakDeduction
    ? calculateHoursWorked(startTime, endTime)
    : calculateHoursWorkedRaw(startTime, endTime);
}

