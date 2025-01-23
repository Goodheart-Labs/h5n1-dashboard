import { MetaculusResponse, ChartDataPoint } from "../types";

export async function fetchMetaculusData(
  questionId: number,
): Promise<ChartDataPoint[]> {
  try {
    // Try API first
    const response = await fetch(`/api/metaculus?questionId=${questionId}`);
    if (!response.ok) throw new Error("API failed");
    const data: MetaculusResponse = await response.json();
    return transformMetaculusData(data);
  } catch (error) {
    console.error("Error fetching Metaculus data:", error);

    // Fall back to example data
    const fallbackResponse = await fetch("/example-data/metaculus.json");
    if (!fallbackResponse.ok) throw new Error("Failed to load example data");
    const data: MetaculusResponse = await fallbackResponse.json();
    return transformMetaculusData(data);
  }
}

function transformMetaculusData(data: MetaculusResponse): ChartDataPoint[] {
  if (!data?.question?.aggregations?.recency_weighted?.history) {
    console.error("Missing expected data structure:", {
      hasQuestion: !!data?.question,
      hasAggregations: !!data?.question?.aggregations,
      hasRecencyWeighted: !!data?.question?.aggregations?.recency_weighted,
      hasHistory: !!data?.question?.aggregations?.recency_weighted?.history,
    });
    return [];
  }

  // First, convert all points and group by day
  const pointsByDay = new Map<
    string,
    {
      values: number[];
      lowerBounds: number[];
      upperBounds: number[];
    }
  >();

  data.question.aggregations.recency_weighted.history.forEach((point) => {
    if (!point.centers?.[0]) return;

    // Get date string in YYYY-MM-DD format
    const date = new Date(point.start_time * 1000);
    const dateKey = date.toISOString().split("T")[0];

    const value = point.centers[0] * 100; // Convert to percentage
    const lowerBound = point.interval_lower_bounds?.[0]
      ? point.interval_lower_bounds[0] * 100
      : value - 5;
    const upperBound = point.interval_upper_bounds?.[0]
      ? point.interval_upper_bounds[0] * 100
      : value + 5;

    const existing = pointsByDay.get(dateKey) || {
      values: [],
      lowerBounds: [],
      upperBounds: [],
    };
    pointsByDay.set(dateKey, {
      values: [...existing.values, value],
      lowerBounds: [...existing.lowerBounds, lowerBound],
      upperBounds: [...existing.upperBounds, upperBound],
    });
  });

  // Convert to array and sort by date
  const dailyPoints = Array.from(pointsByDay.entries())
    .map(([dateKey, data]) => {
      const value =
        data.values.reduce((sum, v) => sum + v, 0) / data.values.length;
      const lowerBound =
        data.lowerBounds.reduce((sum, v) => sum + v, 0) /
        data.lowerBounds.length;
      const upperBound =
        data.upperBounds.reduce((sum, v) => sum + v, 0) /
        data.upperBounds.length;

      return {
        date: new Date(`${dateKey}T12:00:00.000Z`).toISOString(), // Use noon UTC
        value,
        range: [lowerBound, upperBound] as [number, number],
      };
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Fill gaps
  const result: ChartDataPoint[] = [];
  for (let i = 0; i < dailyPoints.length - 1; i++) {
    const current = dailyPoints[i];
    const next = dailyPoints[i + 1];

    result.push(current);

    // Check if there's a gap
    const currentDate = new Date(current.date);
    const nextDate = new Date(next.date);
    const daysDiff =
      (nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);

    // If gap is more than 1 day, interpolate
    if (daysDiff > 1) {
      for (let day = 1; day < daysDiff; day++) {
        const interpolatedDate = new Date(currentDate);
        interpolatedDate.setDate(currentDate.getDate() + day);

        // Linear interpolation
        const progress = day / daysDiff;
        const interpolatedValue =
          current.value + (next.value - current.value) * progress;
        const interpolatedRange: [number, number] = [
          current.range![0] + (next.range![0] - current.range![0]) * progress,
          current.range![1] + (next.range![1] - current.range![1]) * progress,
        ];

        result.push({
          date: interpolatedDate.toISOString(),
          value: interpolatedValue,
          range: interpolatedRange,
        });
      }
    }
  }

  // Don't forget to add the last point
  if (dailyPoints.length > 0) {
    result.push(dailyPoints[dailyPoints.length - 1]);
  }

  return result;
}
