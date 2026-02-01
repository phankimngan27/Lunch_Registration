import { useMemo } from 'react';

interface RegistrationConfig {
  monthly_cutoff_day: number;
  daily_deadline_hour: number;
}

export function useRegistrationPermissions(config: RegistrationConfig) {
  // Check if a specific date can be edited
  const canEditDate = useMemo(() => {
    return (date: Date): boolean => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const currentHour = now.getHours();
      
      const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);

      // Cannot edit past dates
      if (dateStart.getTime() < todayStart.getTime()) {
        return false;
      }

      const tomorrow = new Date(todayStart);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Cannot edit today
      if (dateStart.getTime() === todayStart.getTime()) {
        return false;
      }

      // Tomorrow: only before deadline
      if (dateStart.getTime() === tomorrow.getTime()) {
        return currentHour < config.daily_deadline_hour;
      }

      // Current month (day after tomorrow onwards): always allowed
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        return true;
      }

      // Next month: only after cutoff day
      const currentDay = now.getDate();
      const nextMonth = currentMonth + 1 > 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth + 1 > 11 ? currentYear + 1 : currentYear;
      if (date.getMonth() === nextMonth && date.getFullYear() === nextYear) {
        return currentDay >= config.monthly_cutoff_day;
      }

      return false;
    };
  }, [config.daily_deadline_hour, config.monthly_cutoff_day]);

  // Check if a month can be registered for
  const canRegisterForMonth = useMemo(() => {
    return (month: Date): boolean => {
      const now = new Date();
      const currentDay = now.getDate();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const monthValue = month.getMonth();
      const yearValue = month.getFullYear();

      // Current month: always allowed
      if (monthValue === currentMonth && yearValue === currentYear) {
        return true;
      }

      // Next month: only after cutoff day
      const nextMonth = currentMonth + 1 > 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth + 1 > 11 ? currentYear + 1 : currentYear;
      if (monthValue === nextMonth && yearValue === nextYear) {
        return currentDay >= config.monthly_cutoff_day;
      }

      return false;
    };
  }, [config.monthly_cutoff_day]);

  return {
    canEditDate,
    canRegisterForMonth,
  };
}
