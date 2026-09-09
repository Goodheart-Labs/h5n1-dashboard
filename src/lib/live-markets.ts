// Server-side pointers to markets that still say something about bird flu.
// Each fetch is independent and fails soft: a source that errors just shows no number.
// Not combined into an index; the archived index below has different, resolved inputs.

export type LiveRow = { label: string; probability: number | null };
export type LiveMarket = {
  source: "Kalshi" | "Polymarket" | "Manifold" | "Metaculus";
  title: string;
  url: string;
  probability: number | null; // 0-1
  rows?: LiveRow[]; // for ladder markets
  closes?: string; // ISO date
  note?: string;
};

const REVALIDATE = 3600;

async function getJson<T>(
  url: string,
  headers: Record<string, string> = {},
): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json", ...headers },
      next: { revalidate: REVALIDATE },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

const num = (v: unknown): number | null => {
  const n =
    typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : null;
};

// Kalshi quotes in dollars per contract; use the bid/ask midpoint, falling back to last trade.
type KalshiMarket = {
  ticker: string;
  title: string;
  floor_strike?: number;
  yes_bid_dollars?: string;
  yes_ask_dollars?: string;
  last_price_dollars?: string;
  close_time?: string;
};
function kalshiProb(m: KalshiMarket): number | null {
  const bid = num(m.yes_bid_dollars);
  const ask = num(m.yes_ask_dollars);
  if (bid != null && ask != null && ask > 0) return (bid + ask) / 2;
  return num(m.last_price_dollars);
}

async function kalshiCaseLadder(): Promise<LiveMarket | null> {
  const d = await getJson<{ markets: KalshiMarket[] }>(
    "https://api.elections.kalshi.com/trade-api/v2/markets?event_ticker=KXH5N1COUNT-27JAN01&limit=50",
  );
  if (!d?.markets?.length) return null;
  const rows = d.markets
    .filter((m) => typeof m.floor_strike === "number")
    .sort((a, b) => a.floor_strike! - b.floor_strike!)
    .map((m) => ({
      label: `More than ${m.floor_strike}`,
      probability: kalshiProb(m),
    }));
  return {
    source: "Kalshi",
    title: "How many human H5N1 cases will the US report in 2026?",
    url: "https://kalshi.com/markets/kxh5n1count",
    probability: rows[0]?.probability ?? null,
    rows,
    closes: d.markets[0].close_time,
    note: "Headline number is the chance of at least one case. Thinly traded.",
  };
}

async function kalshiPandemic(): Promise<LiveMarket | null> {
  const d = await getJson<{ market: KalshiMarket }>(
    "https://api.elections.kalshi.com/trade-api/v2/markets/KXNEWOUTBREAK-P-26",
  );
  if (!d?.market) return null;
  return {
    source: "Kalshi",
    title: "Any disease declared a pandemic in 2026?",
    url: "https://kalshi.com/markets/kxnewoutbreak-p",
    probability: kalshiProb(d.market),
    closes: d.market.close_time,
    note: "Any pathogen, not just H5N1.",
  };
}

type PolyEvent = {
  slug: string;
  markets: { question: string; outcomePrices: string; endDate?: string }[];
};
async function polymarket(
  slug: string,
  title: string,
  note?: string,
): Promise<LiveMarket | null> {
  const d = await getJson<PolyEvent[]>(
    `https://gamma-api.polymarket.com/events?slug=${slug}`,
  );
  const m = d?.[0]?.markets?.[0];
  if (!m) return null;
  let yes: number | null = null;
  try {
    yes = num(JSON.parse(m.outcomePrices)?.[0]);
  } catch {
    yes = null;
  }
  return {
    source: "Polymarket",
    title,
    url: `https://polymarket.com/event/${slug}`,
    probability: yes,
    closes: m.endDate,
    note,
  };
}

type ManifoldMarket = {
  question: string;
  probability?: number;
  url: string;
  closeTime?: number;
  uniqueBettorCount?: number;
};
async function manifold(
  slug: string,
  title: string,
): Promise<LiveMarket | null> {
  const m = await getJson<ManifoldMarket>(
    `https://api.manifold.markets/v0/slug/${slug}`,
  );
  if (!m) return null;
  return {
    source: "Manifold",
    title,
    url: m.url,
    probability: typeof m.probability === "number" ? m.probability : null,
    closes: m.closeTime ? new Date(m.closeTime).toISOString() : undefined,
    note: "Play money.",
  };
}

type MetaculusPost = {
  title: string;
  scheduled_close_time?: string;
  question?: {
    aggregations?: {
      recency_weighted?: { latest?: { centers?: number[] } | null };
    };
  };
};
async function metaculus(
  postId: number,
  title: string,
): Promise<LiveMarket | null> {
  const key = process.env.METACULUS_API_KEY;
  const d = await getJson<MetaculusPost>(
    `https://www.metaculus.com/api/posts/${postId}/?with_cp=true`,
    key ? { Authorization: `Token ${key}` } : {},
  );
  if (!d) return null;
  const center =
    d.question?.aggregations?.recency_weighted?.latest?.centers?.[0];
  return {
    source: "Metaculus",
    title,
    url: `https://www.metaculus.com/questions/${postId}/`,
    probability: typeof center === "number" ? center : null,
    closes: d.scheduled_close_time,
    note:
      typeof center === "number"
        ? "Community prediction."
        : "Community prediction not available through our API key; follow the link.",
  };
}

export async function getLiveMarkets(): Promise<{
  markets: LiveMarket[];
  fetchedAt: string;
}> {
  const results = await Promise.all([
    kalshiCaseLadder(),
    metaculus(41677, "Will the WHO announce an H5N1 pandemic before 2030?"),
    manifold(
      "will-the-who-declare-a-h5n1-pandemi-82fde4966973",
      "Will the WHO declare an H5N1 pandemic before 2030?",
    ),
    metaculus(
      45011,
      "Will the WHO declare an H5 virus a Public Health Emergency of International Concern before 2028?",
    ),
    manifold(
      "will-the-who-declare-a-public-healt-0e43c4d9f381",
      "Will the WHO declare a PHEIC for H5N1 before 2030?",
    ),
    polymarket(
      "new-pandemic-in-2026",
      "Any disease declared a pandemic by the WHO in 2026?",
      "Any pathogen, not just H5N1.",
    ),
    polymarket(
      "new-pandemic-before-2028",
      "Any disease declared a pandemic by the WHO before 2028?",
      "Any pathogen, not just H5N1.",
    ),
    kalshiPandemic(),
  ]);
  return {
    markets: results.filter((m): m is LiveMarket => m !== null),
    fetchedAt: new Date().toISOString(),
  };
}
