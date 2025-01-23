const MANIFOLD_API = "https://api.manifold.markets/v0";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return Response.json(
        { error: "Market slug is required" },
        { status: 400 },
      );
    }

    // First fetch to get market ID
    const marketResponse = await fetch(`${MANIFOLD_API}/slug/${slug}`, {
      headers: { Accept: "application/json" },
    });

    if (!marketResponse.ok) {
      return Response.json(
        { error: "Failed to fetch market data" },
        { status: marketResponse.status },
      );
    }

    const marketData = await marketResponse.json();
    const marketId = marketData.id;

    // Second fetch to get detailed market data with answers
    const detailedResponse = await fetch(
      `https://api.manifold.markets/markets-by-ids?ids[]=${marketId}`,
      {
        headers: { Accept: "application/json" },
      },
    );

    if (!detailedResponse.ok) {
      return Response.json(
        { error: "Failed to fetch detailed market data" },
        { status: detailedResponse.status },
      );
    }

    const detailedData = await detailedResponse.json();
    return Response.json(detailedData[0]);
  } catch (error) {
    console.error("Error fetching Manifold grouped data:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
