// Add this to src/utils/quarterLogic.ts

export const fiscalQuarterMonths = {
  "1st": "July - September",
  "2nd": "October - December",
  "3rd": "January - March",
  "4th": "April - June",
};

export const getMonthsBetweenDates = (start: string, end: string): string => {
  if (!start || !end) return "Select dates to see covered months";

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (startDate > endDate) return "Invalid date range";

  const months = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    months.push(currentDate.toLocaleString("default", { month: "long" }));
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  // Remove duplicates just in case, and join with commas
  return [...new Set(months)].join(", ");
};

export const getCurrentQuarter = (): string => {
  const month = new Date().getMonth() + 1; // getMonth() is 0-indexed

  if (month >= 1 && month <= 3) return "1st";
  if (month >= 4 && month <= 6) return "2nd";
  if (month >= 7 && month <= 9) return "3rd";
  return "4th";
};

export const getWeeksInDateRange = (
  startDate: string,
  endDate: string,
): number[] => {
  if (!startDate || !endDate) return [];

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) return [];

  const weeks: number[] = [];
  const current = new Date(start);

  // Reset to the first day of the week for the start date
  const dayOfWeek = current.getDay();
  current.setDate(current.getDate() - dayOfWeek);

  // Iterate through each week in the date range
  while (current <= end) {
    const weekStart = new Date(current);
    const weekEnd = new Date(current);
    weekEnd.setDate(weekEnd.getDate() + 6);

    // Check if this week overlaps with our date range
    if (weekEnd >= start && weekStart <= end) {
      weeks.push(weeks.length + 1);
    }

    // Move to next week
    current.setDate(current.getDate() + 7);
  }

  return weeks;
};

export const getWeekDates = (
  year: number,
  month: number,
  week: number,
): { start: Date; end: Date } => {
  const firstDay = new Date(year, month - 1, 1);
  const firstDayOfWeek = firstDay.getDay();

  const weekStart = (week - 1) * 7 - firstDayOfWeek + 1;
  const startDate = new Date(year, month - 1, weekStart);
  const endDate = new Date(year, month - 1, weekStart + 6);

  return { start: startDate, end: endDate };
};

export const formatWeekRange = (startDate: string, week: number): string => {
  const start = new Date(startDate);

  // Find the actual week start date based on week number
  const current = new Date(start);
  const dayOfWeek = current.getDay();
  current.setDate(current.getDate() - dayOfWeek);

  // Move to the requested week
  current.setDate(current.getDate() + (week - 1) * 7);

  const weekStart = new Date(current);
  const weekEnd = new Date(current);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const monthName = weekStart.toLocaleString("default", { month: "short" });

  return `${monthName} ${weekStart.getDate()}-${weekEnd.getDate()}`;
};

// ✅ Auto-generate quarter dates from fiscal year starting July (e.g., "2025-2026" = Jul 2025 - Jun 2026)
export const getAutoQuarterDates = (
  fiscalYear: string,
): Record<string, { start: string; end: string }> => {
  const [startYear, endYear] = fiscalYear.split("-").map(Number);

  if (!startYear || !endYear) {
    return {
      "1st": { start: "", end: "" },
      "2nd": { start: "", end: "" },
      "3rd": { start: "", end: "" },
      "4th": { start: "", end: "" },
    };
  }

  const pad = (num: number) => String(num).padStart(2, "0");
  const formatDate = (year: number, month: number, day: number) =>
    `${year}-${pad(month)}-${pad(day)}`;

  // Fiscal year runs: Jul (start) - Jun (end)
  // Q1: Jul - Sep (start year)
  // Q2: Oct - Dec (start year)
  // Q3: Jan - Mar (end year)
  // Q4: Apr - Jun (end year)
  return {
    "1st": {
      start: formatDate(startYear, 7, 1),
      end: formatDate(startYear, 9, 30),
    },
    "2nd": {
      start: formatDate(startYear, 10, 1),
      end: formatDate(startYear, 12, 31),
    },
    "3rd": {
      start: formatDate(endYear, 1, 1),
      end: formatDate(endYear, 3, 31),
    },
    "4th": {
      start: formatDate(endYear, 4, 1),
      end: formatDate(endYear, 6, 30),
    },
  };
};
