import { ChartDataPoint, ManifoldResponse } from "../risk-index/types";

export type ManifoldMarketInfo = {
  title: string;
  description: string | null;
  probability: number;
  lastUpdatedTime: number;
  history: ChartDataPoint[];
};

interface ManifoldBet {
  createdTime: number;
  probBefore: number;
  probAfter: number;
}

export async function fetchManifoldData(
  slug: string,
): Promise<ManifoldMarketInfo> {
  try {
    const response = await fetch(`/api/manifold?slug=${slug}`);
    if (!response.ok) {
      throw new Error("Failed to fetch Manifold data");
    }
    const { market, bets } = await response.json();
    const data = market as ManifoldResponse;
    const betHistory = bets as ManifoldBet[];

    // Extract simple description from first paragraph if available
    const firstParagraph = data.description.content[0];
    const simpleDescription = firstParagraph?.content?.[0]?.text || null;

    return {
      title: data.question,
      description: simpleDescription,
      probability: data.probability,
      lastUpdatedTime: data.lastUpdatedTime,
      history: transformManifoldData(betHistory),
    };
  } catch (error) {
    console.error("Error fetching Manifold data:", error);
    throw error;
  }
}

function transformManifoldData(bets: ManifoldBet[]): ChartDataPoint[] {
  if (!bets?.length) {
    console.error("No bet history available");
    return [];
  }

  return bets.map((bet) => ({
    date: new Date(bet.createdTime).toISOString(),
    value: bet.probAfter,
  }));
}
