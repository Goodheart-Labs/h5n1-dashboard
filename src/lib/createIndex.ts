import { ChartDataPoint } from "./types";
import { getInterpolatedValue } from "./getInterpolatedValue";

const TARGET_TIME_RESOLUTION = 24 * 60 * 60 * 1000; // 1 day in milliseconds

export const WEAK_AGI_DATE_RANGE = {
  start: new Date("2020-03-26").getTime(),
  end: new Date("2200-01-03").getTime(),
};

export const FULL_AGI_DATE_RANGE = {
  start: new Date("2020-08-25").getTime(),
  end: new Date("2199-12-25").getTime(),
};

export function percentageToDate(
  percentage: number,
  range: { start: number; end: number },
): number {
  return range.start + percentage * (range.end - range.start);
}

export function dateToPercentage(
  date: number,
  range: { start: number; end: number },
): number {
  return (date - range.start) / (range.end - range.start);
}

export function createAgiIndex(
  weakAgiData: ChartDataPoint[],
  fullAgiData: ChartDataPoint[],
): { index: ChartDataPoint[]; minDate: string; maxDate: string } {
  if (weakAgiData.length === 0 || fullAgiData.length === 0)
    return { index: [], minDate: "", maxDate: "" };

  // Convert percentages to dates
  const weakAgiDates = weakAgiData.map((p) => ({
    date: p.date,
    value: percentageToDate(p.value / 100, WEAK_AGI_DATE_RANGE),
    range: p.range
      ? ([
          percentageToDate(p.range[0] / 100, WEAK_AGI_DATE_RANGE),
          percentageToDate(p.range[1] / 100, WEAK_AGI_DATE_RANGE),
        ] as [number, number])
      : undefined,
  }));

  const fullAgiDates = fullAgiData.map((p) => ({
    date: p.date,
    value: percentageToDate(p.value / 100, FULL_AGI_DATE_RANGE),
    range: p.range
      ? ([
          percentageToDate(p.range[0] / 100, FULL_AGI_DATE_RANGE),
          percentageToDate(p.range[1] / 100, FULL_AGI_DATE_RANGE),
        ] as [number, number])
      : undefined,
  }));

  // Find the overlapping date range
  const weakDates = weakAgiDates.map((p) => new Date(p.date).getTime());
  const fullDates = fullAgiDates.map((p) => new Date(p.date).getTime());

  const startDate = Math.max(Math.min(...weakDates), Math.min(...fullDates));
  const endDate = Math.min(Math.max(...weakDates), Math.max(...fullDates));

  // Create daily data points within the range
  const index: ChartDataPoint[] = [];
  for (let date = startDate; date <= endDate; date += TARGET_TIME_RESOLUTION) {
    const isoDate = new Date(date).toISOString();

    const weakPoint = getInterpolatedValue(weakAgiDates, isoDate);
    const fullPoint = getInterpolatedValue(fullAgiDates, isoDate);

    if (weakPoint === undefined || fullPoint === undefined) continue;

    // Get the ranges for this point from both datasets
    const weakRangePoint = weakAgiDates.find((p) => {
      const pointDate = new Date(p.date).getTime();
      return (
        Math.abs(pointDate - new Date(isoDate).getTime()) <
        TARGET_TIME_RESOLUTION
      );
    });
    const fullRangePoint = fullAgiDates.find((p) => {
      const pointDate = new Date(p.date).getTime();
      return (
        Math.abs(pointDate - new Date(isoDate).getTime()) <
        TARGET_TIME_RESOLUTION
      );
    });

    // Average date
    const averageDate = (weakPoint + fullPoint) / 2;

    // Calculate combined range
    let combinedRange: [number, number] | undefined;
    if (weakRangePoint?.range || fullRangePoint?.range) {
      const allRangePoints = [
        ...(weakRangePoint?.range || []),
        ...(fullRangePoint?.range || []),
      ].filter(Boolean);

      if (allRangePoints.length > 0) {
        combinedRange = [
          Math.min(...allRangePoints),
          Math.max(...allRangePoints),
        ] as [number, number];
      }
    }

    // Convert back to percentage
    const combinedDateRange = {
      start: Math.min(WEAK_AGI_DATE_RANGE.start, FULL_AGI_DATE_RANGE.start),
      end: Math.max(WEAK_AGI_DATE_RANGE.end, FULL_AGI_DATE_RANGE.end),
    };

    const indexValue = dateToPercentage(averageDate, combinedDateRange) * 100;
    const range = combinedRange
      ? ([
          dateToPercentage(combinedRange[0], combinedDateRange) * 100,
          dateToPercentage(combinedRange[1], combinedDateRange) * 100,
        ] as [number, number])
      : undefined;

    index.push({
      date: isoDate,
      value: indexValue,
      range,
    });
  }

  const minDate = new Date(startDate).toISOString();
  const maxDate = new Date(endDate).toISOString();

  return { index, minDate, maxDate };
}
