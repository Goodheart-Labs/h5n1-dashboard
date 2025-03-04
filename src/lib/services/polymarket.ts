import { PolymarketResponse, ChartDataPoint } from "../risk-index/types";

export async function fetchPolymarketData(
  slug: string,
): Promise<ChartDataPoint[]> {
  try {
    // First get the market data to get the marketId
    const marketResponse = await fetch(`/api/polymarket?slug=${slug}`);
    if (!marketResponse.ok) throw new Error("Market API failed");
    const marketData = (await marketResponse.json()) as {
      startDate: string;
      endDate: string;
      clobTokenIds: string;
      closed: boolean;
    };

    console.log("Market data:", marketData);

    // Get the first clubTokenId from the clobTokenIds array
    const clubTokenId = JSON.parse(marketData.clobTokenIds)[0];

    // Create params
    const params = new URLSearchParams({
      marketId: clubTokenId,
    });

    if (marketData.closed) {
      // Set startTs and endTs (a unix timestamp in UTC)
      params.set("startTs", convertToUnixTimestamp(marketData.startDate));
      params.set("endTs", convertToUnixTimestamp(marketData.endDate));
    }

    console.log("Params:", params.toString());

    // Then fetch the timeseries with the marketId
    const timeseriesResponse = await fetch(
      `/api/polymarket-timeseries?${params.toString()}`,
    );
    if (!timeseriesResponse.ok) throw new Error("Timeseries API failed");
    const timeseriesData = await timeseriesResponse.json();

    return transformPolymarketData(timeseriesData);
  } catch (error) {
    console.error("Error fetching Polymarket data:", error);

    // Fall back to example data
    const exampleData = await fetchExampleData();
    return transformPolymarketData(exampleData);
  }
}

async function fetchExampleData(): Promise<PolymarketResponse> {
  const response = await fetch("/example-data/timeseries.json");
  if (!response.ok) throw new Error("Failed to load example data");
  return response.json();
}

function transformPolymarketData(data: PolymarketResponse): ChartDataPoint[] {
  if (!data?.history) {
    return [];
  }
  return data.history.map((point) => ({
    date: new Date(point.t * 1000).toISOString(),
    value: point.p * 100,
  }));
}

// Converts from a timezone-aware date string to a unix timestamp in UTC
function convertToUnixTimestamp(date: string): string {
  const dateObj = new Date(date);
  return dateObj.getTime().toString();
}
