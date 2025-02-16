import { MetaculusResponse, ChartDataPoint } from "../risk-index/types";

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
  if (!data?.question?.aggregations?.recency_weighted?.history) return [];
  const history = data.question.aggregations.recency_weighted.history.sort(
    (a, b) => a.start_time - b.start_time,
  );
  const start = history[0].start_time;
  const end = history[history.length - 1].start_time;

  const points: ChartDataPoint[] = [];

  let index = 0;
  let currentDate = start;
  while (currentDate <= end) {
    const sample = history[index];
    const center = sample.centers[sample.centers.length - 1];
    points.push({
      date: new Date(currentDate * 1000).toISOString(),
      value: 100 * center,
    });
    currentDate += 24 * 60 * 60;

    // increment index until the next sample is after the current date
    let tmpIndex = index;
    while (
      currentDate <= end &&
      tmpIndex < history.length &&
      history[tmpIndex].start_time < currentDate
    ) {
      tmpIndex++;
    }
    index = tmpIndex - 1;
  }

  return points;
}
