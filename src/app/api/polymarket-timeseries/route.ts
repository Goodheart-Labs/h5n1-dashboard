import { NextResponse } from "next/server";

const CLOB_API = "https://clob.polymarket.com";

// 106312791964557364184052642373426857106392360847438469940517961069035123954706

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    // Note! this actually expects a clubTokenId
    const marketId = searchParams.get("marketId");

    const startTs = searchParams.get("startTs");
    const endTs = searchParams.get("endTs");

    if (!marketId) {
      return NextResponse.json(
        { error: "Market ID is required" },
        { status: 400 },
      );
    }

    const url = new URL(`${CLOB_API}/prices-history`);
    const params = new URLSearchParams({
      market: marketId,
      fidelity: "60",
    });

    // If user passed start and end time use that
    if (startTs && endTs) {
      // console.log("Setting start and end time");
      params.set("startTs", startTs);
      params.set("endTs", endTs);
    } else {
      params.set("interval", "1m");
    }

    // Add the params to the url
    url.search = params.toString();

    const timeseriesResponse = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!timeseriesResponse.ok) {
      const errorText = await timeseriesResponse.text();
      console.error("Error response body:", errorText);

      return NextResponse.json(
        {
          error: "Failed to fetch timeseries data",
          status: timeseriesResponse.status,
          details: errorText,
        },
        { status: timeseriesResponse.status },
      );
    }

    const timeseriesData = await timeseriesResponse.json();
    return NextResponse.json(timeseriesData);
  } catch (error) {
    console.error("Error fetching timeseries data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
