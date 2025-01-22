const MANIFOLD_API = "https://api.manifold.markets/v0";

interface ManifoldBet {
  createdTime: number;
  probBefore: number;
  probAfter: number;
}

export async function GET(request: Request) {
  try {
    // Get slug from URL params
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return Response.json(
        { error: "Market slug is required" },
        { status: 400 },
      );
    }

    const marketResponse = await fetch(`${MANIFOLD_API}/slug/${slug}`, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!marketResponse.ok) {
      const errorText = await marketResponse.text();
      console.error("Error response body:", errorText);

      return Response.json(
        {
          error: "Failed to fetch Manifold market data",
          status: marketResponse.status,
          details: errorText,
        },
        { status: marketResponse.status },
      );
    }

    const marketData = await marketResponse.json();

    // Fetch bets data
    const now = Date.now();
    const betsResponse = await fetch(
      `${MANIFOLD_API}/bets?contractId=${marketData.id}&points=true&limit=1000&filterRedemptions=true&beforeTime=${now}&afterTime=${marketData.createdTime}`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    );

    if (!betsResponse.ok) {
      const errorText = await betsResponse.text();
      console.error("Error fetching bets:", errorText);
      return Response.json(
        { error: "Failed to fetch bets data", details: errorText },
        { status: betsResponse.status },
      );
    }

    const betsData = (await betsResponse.json()) as ManifoldBet[];
    const sortedBets = betsData.sort((a, b) => a.createdTime - b.createdTime);
    return Response.json({ market: marketData, bets: sortedBets });
  } catch (error) {
    console.error("Error fetching Manifold market data:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
