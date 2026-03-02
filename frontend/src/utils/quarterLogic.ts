// Add this to src/utils/quarterLogic.ts

export const fiscalQuarterMonths = {
  "1st": "January - March",
  "2nd": "April - June",
  "3rd": "July - September",
  "4th": "October - December",
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
