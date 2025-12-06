import { kalshiFetch } from "@/lib/kalshi/fetch";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const marketTicker = searchParams.get("marketTicker");
  const seriesTicker = searchParams.get("seriesTicker");
  const marketId = searchParams.get("marketId");

  if (!marketTicker || !seriesTicker || !marketId) {
    return Response.json(
      { error: "Missing required parameters" },
      { status: 400 },
    );
  }

  try {
    const marketData = await kalshiFetch(`/markets/${marketTicker}`);

    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(now.getMonth() - 1);

    // Round to nearest hour
    now.setMinutes(0, 0, 0);
    oneMonthAgo.setMinutes(0, 0, 0);

    const start_ts = Math.floor(oneMonthAgo.getTime() / 1000);
    const end_ts = Math.floor(now.getTime() / 1000);

    const candlesticks = await kalshiFetch(
      `/series/${seriesTicker}/markets/${marketId}/candlesticks`,
      {
        query: {
          start_ts: start_ts,
          end_ts: end_ts,
          period_interval: 60,
        },
      },
    );

    return Response.json(
      {
        marketData,
        candlesticks,
        dateRange: {
          start: oneMonthAgo.toISOString(),
          end: now.toISOString(),
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
