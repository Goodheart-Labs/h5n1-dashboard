import { kalshiFetch } from "@/lib/kalshi/fetch";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const marketTicker = searchParams.get("marketTicker");
    const seriesTicker = searchParams.get("seriesTicker");
    const marketId = searchParams.get("marketId");

    if (!marketTicker || !seriesTicker || !marketId) {
      return Response.json(
        { error: "marketTicker, seriesTicker, and marketId are required" },
        { status: 400 },
      );
    }

    const marketData = await kalshiFetch(`/markets/${marketTicker}`);

    const openTime = new Date(marketData.market.open_time);
    const now = new Date();
    const oneMonthAgo = new Date(openTime);
    oneMonthAgo.setMonth(openTime.getMonth() - 1);

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

    return Response.json({
      marketData,
      candlesticks,
      dateRange: {
        start: oneMonthAgo.toISOString(),
        end: now.toISOString(),
      },
    });
  } catch (error) {
    console.error("Kalshi API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
