import { MetaculusResponse, ChartDataPoint } from "../types";

export async function fetchMetaculusData(questionId: number): Promise<{
  question: MetaculusResponse["question"];
  data: ChartDataPoint[];
}> {
  // Try API first
  const response = await fetch(`/api/metaculus?questionId=${questionId}`);
  if (!response.ok) throw new Error("API failed");
  const data: MetaculusResponse = await response.json();

  const transformed = transformMetaculusData(data);

  return { question: data.question, data: transformed };
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

  const history = data.question.aggregations.recency_weighted.history.sort(
    (a, b) => a.start_time - b.start_time,
  );

  const start = history[0].start_time;
  const end = history[history.length - 1].start_time;

  const points: ChartDataPoint[] = [];

  const transform = getTransform(data);

  let index = 0;
  let currentDate = start;
  while (currentDate <= end) {
    const sample = history[index];
    const center = sample.centers[0];
    const lower = sample.interval_lower_bounds?.[0];
    const upper = sample.interval_upper_bounds?.[0];
    points.push({
      date: new Date(currentDate * 1000).toISOString(),
      value: transform(center),
      range: [transform(lower ?? 0), transform(upper ?? 0)],
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

export function getTransform(data: MetaculusResponse) {
  function m() {
    return (t: number) => {
      return null == t;
    };
  }

  return (value: number) => {
    let t;
    const { range_min, range_max, zero_point } = data.question.scaling;
    if (m()(range_max) || m()(range_min)) return value;
    if (null !== zero_point) {
      const n = (range_max - zero_point) / (range_min - zero_point);
      t = range_min + ((range_max - range_min) * (n ** value - 1)) / (n - 1);
    } else
      t =
        null === range_min || null === range_max
          ? value
          : range_min + (range_max - range_min) * value;
    return t;
  };
}
