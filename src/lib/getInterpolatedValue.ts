import { ChartDataPoint } from "./types";

/**
 * This function will search for a value in a timeseries.
 * If it finds an exact match, it will return the value.
 * If it finds matches on both sides of the target date, it will interpolate between the two.
 * If it finds matches only on one side, it will return the closest match.
 */
export function getInterpolatedValue(
  data: ChartDataPoint[],
  targetDate: string,
) {
  // Convert target date to timestamp for comparison
  const targetTime = new Date(targetDate).getTime();

  // Find exact match first
  const exactMatch = data.find((point) => point.date === targetDate);
  if (exactMatch) return exactMatch.value;

  // Sort data by date if not already sorted
  const sortedData = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  // Find the closest points before and after target date
  const before = sortedData.findLast(
    (point) => new Date(point.date).getTime() <= targetTime,
  );
  const after = sortedData.find(
    (point) => new Date(point.date).getTime() > targetTime,
  );

  // If we have both points, interpolate
  if (before && after) {
    const beforeTime = new Date(before.date).getTime();
    const afterTime = new Date(after.date).getTime();
    const timeDiff = afterTime - beforeTime;
    const valueDiff = after.value - before.value;
    const timeRatio = (targetTime - beforeTime) / timeDiff;
    return before.value + valueDiff * timeRatio;
  }

  if (before && !after) {
    console.log("No data found for", targetDate);
    return before.value;
  }

  if (after && !before) {
    console.log("No data found for", targetDate);
    return after.value;
  }

  console.log("No data found for", targetDate);
  return 0;
}
