import { parse } from "date-fns";
import { CdcDataPoint, ChartDataPoint } from "../types";

export async function fetchCdcData(): Promise<ChartDataPoint[]> {
  const data = await fetchFromAPI();
  const points = transformCdcData(data);
  return fillMissingMonths(points);
}

async function fetchFromAPI(): Promise<CdcDataPoint[]> {
  const response = await fetch("/api/cdc-data");
  if (!response.ok) throw new Error("API failed");
  return response.json();
}

function transformCdcData(data: CdcDataPoint[]): ChartDataPoint[] {
  return data.map((point) => {
    const date = parse(point.Month, "M/1/yyyy", new Date()).toISOString();
    const cases = Object.entries(point)
      .filter(([key]) => !["Range", "Month"].includes(key))
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .reduce((sum, [_, val]) => sum + parseInt(val) || 0, 0);

    return { date, value: cases };
  });
}

function fillMissingMonths(points: ChartDataPoint[]): ChartDataPoint[] {
  if (!points.length) return [];

  const dates = points.map((p) => new Date(p.date));
  const start = new Date(Math.min(...dates.map((d) => d.getTime())));
  const end = new Date(Math.max(...dates.map((d) => d.getTime())));

  const filled: ChartDataPoint[] = [];
  const current = new Date(start);

  while (current <= end) {
    const isoDate = current.toISOString();
    const existing = points.find((p) => p.date === isoDate);

    filled.push({
      date: isoDate,
      value: existing?.value || 0,
    });

    current.setMonth(current.getMonth() + 1);
  }

  return filled;
}
