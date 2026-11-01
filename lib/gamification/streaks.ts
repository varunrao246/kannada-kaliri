/**
 * Gamification & Learner Motivation Engine — Streak Calculation
 * Kannada Kaliri — Milestone 09
 *
 * Implements robust date-based streak logic supporting timezone offsets:
 * - Counts only meaningful active days (lessons, assessments, scenarios)
 * - Distinguishes today vs yesterday vs broken streaks
 * - Produces rolling 7-day visual activity calendar
 */

import type { StreakStats, StreakDayActivity } from './types';

export interface ActivityDateRecord {
  activityDate: string; // 'YYYY-MM-DD'
  hasActivity: boolean;
}

const KANNADA_DAYS = ['ಭಾ', 'ಸೋ', 'ಮಂ', 'ಬು', 'ಗು', 'ಶು', 'ಶ'];
const DAY_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function computeStreakStats(
  activeDates: string[],
  userLocalDate: string = new Date().toISOString().slice(0, 10)
): StreakStats {
  const dateSet = new Set(activeDates);
  const today = userLocalDate;

  // Compute yesterday's date
  const todayObj = new Date(today + 'T00:00:00Z');
  const yesterdayObj = new Date(todayObj.getTime() - 24 * 60 * 60 * 1000);
  const yesterday = yesterdayObj.toISOString().slice(0, 10);

  const isActiveToday = dateSet.has(today);
  const isActiveYesterday = dateSet.has(yesterday);

  // 1. Current Streak Calculation
  let currentStreak = 0;
  if (isActiveToday || isActiveYesterday) {
    let checkDateObj = isActiveToday ? todayObj : yesterdayObj;
    while (true) {
      const checkStr = checkDateObj.toISOString().slice(0, 10);
      if (dateSet.has(checkStr)) {
        currentStreak += 1;
        checkDateObj = new Date(checkDateObj.getTime() - 24 * 60 * 60 * 1000);
      } else {
        break;
      }
    }
  }

  // 2. Longest Streak Calculation across all recorded dates
  const sortedUniqueDates = Array.from(dateSet).sort();
  let longestStreak = currentStreak;
  let tempStreak = 0;
  let prevDateObj: Date | null = null;

  for (const dateStr of sortedUniqueDates) {
    const currentDateObj = new Date(dateStr + 'T00:00:00Z');
    if (!prevDateObj) {
      tempStreak = 1;
    } else {
      const diffDays = Math.round((currentDateObj.getTime() - prevDateObj.getTime()) / (24 * 60 * 60 * 1000));
      if (diffDays === 1) {
        tempStreak += 1;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
    prevDateObj = currentDateObj;
  }

  // 3. Last 7 Days Rolling Strip
  const activityLast7Days: StreakDayActivity[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayObj.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().slice(0, 10);
    const dayOfWeek = d.getUTCDay();
    const hasActivity = dateSet.has(dateStr);

    activityLast7Days.push({
      date: dateStr,
      dayName: DAY_NAMES[dayOfWeek],
      dayLabel: DAY_SHORT[dayOfWeek],
      dayLabelKannada: KANNADA_DAYS[dayOfWeek],
      hasActivity,
      isActive: hasActivity,
      isToday: dateStr === today,
    });
  }

  return {
    currentStreak,
    longestStreak,
    isActiveToday,
    activityLast7Days,
    last7Days: activityLast7Days,
  };
}
