import { convertSolar2Lunar } from './lunarCalendar';

/**
 * Memoized lunar calendar calculations
 * Cache results to avoid recalculating for the same dates
 */

interface LunarDate {
  day: number;
  month: number;
  isLeapMonth: boolean;
}

// Cache for lunar date calculations
const lunarCache = new Map<string, LunarDate>();

/**
 * Get lunar date with caching
 * @param day Solar day (1-31)
 * @param month Solar month (1-12)
 * @param year Solar year
 * @returns Lunar date object
 */
export function getLunarDateCached(day: number, month: number, year: number): LunarDate {
  const cacheKey = `${year}-${month}-${day}`;
  
  // Check cache first
  if (lunarCache.has(cacheKey)) {
    return lunarCache.get(cacheKey)!;
  }
  
  // Calculate if not in cache
  try {
    const lunar = convertSolar2Lunar(day, month, year, 7);
    const result: LunarDate = {
      day: lunar[0],
      month: lunar[1],
      isLeapMonth: lunar[2] === 1
    };
    
    // Store in cache
    lunarCache.set(cacheKey, result);
    
    // Limit cache size to prevent memory issues (keep last 1000 entries)
    if (lunarCache.size > 1000) {
      const firstKey = lunarCache.keys().next().value;
      if (firstKey) {
        lunarCache.delete(firstKey);
      }
    }
    
    return result;
  } catch (error) {
    return { day: 0, month: 0, isLeapMonth: false };
  }
}

/**
 * Check if a lunar day is a vegetarian day (1st or 15th)
 * @param lunarDay Lunar day number
 * @returns true if vegetarian day
 */
export function isVegetarianLunarDay(lunarDay: number): boolean {
  return lunarDay === 1 || lunarDay === 15;
}

/**
 * Clear the lunar cache (useful for testing or memory management)
 */
export function clearLunarCache(): void {
  lunarCache.clear();
}
