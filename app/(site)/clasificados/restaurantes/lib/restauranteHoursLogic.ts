/**
 * Real-time open/closed status logic for Restaurantes results cards
 * Uses current timestamp, weekday, and business hours to determine accurate status
 */

export type HoursStatus = {
  isOpenNow: boolean;
  openUntil?: string;
  closeTime?: string;
  status: 'open' | 'closed' | 'unknown';
};

export type DaySchedule = {
  openTime?: string;
  closeTime?: string;
  closed?: boolean;
};

export type WeeklyHours = {
  [key: string]: DaySchedule;
};

function parseTime(timeStr?: string): number | null {
  if (!timeStr || !/^\d{1,2}:\d{2}$/.test(timeStr)) return null;
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }
  return hours * 60 + minutes;
}

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
}

function getCurrentMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function getCurrentDayKey(): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date().getDay()];
}

/**
 * Compute real-time open/closed status based on business hours
 */
export function computeHoursStatus(weeklyHours?: WeeklyHours, now: Date = new Date()): HoursStatus {
  // If no hours data, return unknown
  if (!weeklyHours) {
    return { isOpenNow: false, status: 'unknown' };
  }

  const dayKey = getCurrentDayKey();
  const todaySchedule = weeklyHours[dayKey];

  // If no schedule for today, return unknown
  if (!todaySchedule) {
    return { isOpenNow: false, status: 'unknown' };
  }

  // If explicitly closed today
  if (todaySchedule.closed) {
    return { isOpenNow: false, status: 'closed' };
  }

  const openMinutes = parseTime(todaySchedule.openTime);
  const closeMinutes = parseTime(todaySchedule.closeTime);

  // If times are invalid, return unknown
  if (openMinutes === null || closeMinutes === null) {
    return { isOpenNow: false, status: 'unknown' };
  }

  const currentMinutes = getCurrentMinutes();
  let open = openMinutes;
  let close = closeMinutes;

  // Handle overnight hours (e.g., 10 PM to 2 AM)
  if (close < open) {
    if (currentMinutes >= open || currentMinutes < close) {
      return {
        isOpenNow: true,
        openUntil: formatTime(close),
        closeTime: formatTime(close),
        status: 'open'
      };
    }
  } else {
    // Normal same-day hours
    if (currentMinutes >= open && currentMinutes < close) {
      return {
        isOpenNow: true,
        openUntil: formatTime(close),
        closeTime: formatTime(close),
        status: 'open'
      };
    }
  }

  return {
    isOpenNow: false,
    closeTime: formatTime(open),
    status: 'closed'
  };
}

/**
 * Convert application hours format to weekly hours format
 */
export function normalizeWeeklyHours(appHours: any): WeeklyHours | undefined {
  if (!appHours) return undefined;

  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const weeklyHours: WeeklyHours = {};

  for (const day of days) {
    const dayData = appHours[day];
    if (dayData) {
      weeklyHours[day] = {
        openTime: dayData.openTime,
        closeTime: dayData.closeTime,
        closed: dayData.closed
      };
    }
  }

  return weeklyHours;
}
