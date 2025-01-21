import { kalshiFetch } from "@/lib/kalshi/fetch";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const marketTicker = searchParams.get("marketTicker");
  const seriesTicker = searchParams.get("seriesTicker");
  const marketId = searchParams.get("marketId");
  const period_interval = searchParams.get("period_interval");

  if (!(marketTicker || seriesTicker) || !marketId || !period_interval) {
    return Response.json(
      { error: "Missing required parameters" },
      { status: 400 },
    );
  }

  try {
    const marketData = await kalshiFetch(`/markets/${marketTicker}`);
    const start_ts = Math.floor(
      new Date(marketData.market.open_time).getTime() / 1000,
    );
    const end_ts = Math.floor(
      new Date(marketData.market.close_time).getTime() / 1000,
    );

    const candlesticks = await kalshiFetch(
      `/series/${seriesTicker ?? marketTicker}/markets/${marketId}/candlesticks`,
      {
        query: {
          start_ts,
          end_ts,
          period_interval,
        },
      },
    );

    return Response.json(
      {
        marketData,
        candlesticks,
        dateRange: {
          start: marketData.market.open_time,
          end: marketData.market.close_time,
          interval: period_interval,
        },
      },
      {
        headers: {
          "Cache-Control": "public, max-age=3600, stale-while-revalidate=3600",
        },
      },
    );
  } catch (error) {
    console.error("Kalshi API error:", error);
    return Response.json(
      { error: "Internal server error" },
      {
        status: 500,
        headers: {
          "Cache-Control": "public, max-age=3600, stale-while-revalidate=3600",
        },
      },
    );
  }
}
