// Rebuilds the frozen dashboard datasets from the archived API snapshots.
// Run from repo root: bun archive/build.ts
// Inputs:  public/archive/raw/wayback/*.json (Wayback Machine captures of this site's own API routes)
// Outputs: src/data/archive/*.json (bundled into the page) + src/data/archive/manifest.json
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import {
  combineDataSources,
  WEIGHTS,
} from "../src/lib/risk-index/combineDataSources";
import type {
  ChartDataPoint,
  KalshiResponse,
  MetaculusResponse,
  PolymarketResponse,
  CdcDataPoint,
} from "../src/lib/risk-index/types";

const RAW = "public/archive/raw/wayback";
const OUT = "src/data/archive"; // bundled into the page
const PUB = "public/archive/data"; // served for download
mkdirSync(OUT, { recursive: true });
mkdirSync(PUB, { recursive: true });
const read = <T>(name: string): T =>
  JSON.parse(readFileSync(`${RAW}/${name}`, "utf8"));
const iso = (s: number) => new Date(s * 1000).toISOString();
const round = (v: number) => Math.round(v * 100) / 100;

// Metaculus: recency-weighted community mean, one point per aggregation step
const meta = read<MetaculusResponse>("metaculus_30960_20250208.json");
const metaculus: ChartDataPoint[] =
  meta.question.aggregations.recency_weighted.history.map((p) => ({
    date: iso(p.start_time),
    value: round(p.means[0] * 100),
  }));

// Kalshi: hourly candlesticks, forward-filled on last trade price (same rule the live site used).
// Snapshots overlap, so merge by timestamp and take the latest capture for each hour.
function kalshiSeries(files: string[]): ChartDataPoint[] {
  const byTs = new Map<number, { price: number | null; yesBid: number }>();
  for (const f of files) {
    const r = read<KalshiResponse>(f);
    for (const c of r.candlesticks.candlesticks) {
      byTs.set(c.end_period_ts, {
        price: c.price.close ?? c.price.open,
        yesBid: c.yes_bid.close,
      });
    }
  }
  const ts = Array.from(byTs.keys()).sort((a, b) => a - b);
  let last = byTs.get(ts[0])!.price ?? byTs.get(ts[0])!.yesBid;
  const out: ChartDataPoint[] = [];
  for (let t = ts[0]; t <= ts[ts.length - 1]; t += 3600) {
    const c = byTs.get(t);
    if (c?.price != null) last = c.price;
    out.push({ date: iso(t), value: last });
  }
  return out;
}
const kalshiCases = kalshiSeries([
  "kalshi_cases_20250108.json",
  "kalshi_cases_20250124.json",
  "kalshi_cases_20250208.json",
]);
const kalshiTravel = kalshiSeries([
  "kalshi_travel_20250108.json",
  "kalshi_travel_20250117.json",
  "kalshi_travel_20250124.json",
  "kalshi_travel_20250208.json",
]);

// Polymarket: hourly price history of the YES token
const poly = read<PolymarketResponse>("polymarket_timeseries_20250208.json");
const polymarket: ChartDataPoint[] = poly.history.map((p) => ({
  date: iso(p.t),
  value: round(p.p * 100),
}));

// CDC: monthly confirmed human H5N1 cases worldwide (sum across countries), 2020-2024
const cdcRows = read<CdcDataPoint[]>("cdc_data_20250124.json");
const cdc: ChartDataPoint[] = cdcRows.map((row) => {
  const [m, , y] = row.Month.split("/").map(Number);
  const cases = Object.entries(row)
    .filter(([k]) => k !== "Range" && k !== "Month")
    .reduce((s, [, v]) => s + (parseInt(v) || 0), 0);
  return { date: new Date(Date.UTC(y, m - 1, 1)).toISOString(), value: cases };
});

// Risk index: identical formula to the live site (combineDataSources), over the window all three sources cover
const { riskIndex, hourlyDatasets } = combineDataSources(
  metaculus,
  kalshiTravel,
  kalshiCases,
);
const index = riskIndex.map((p) => ({ date: p.date, value: round(p.value) }));
const components = index.map((p, i) => ({
  date: p.date,
  metaculus: round(hourlyDatasets.meta[i].value),
  kalshiCases: round(hourlyDatasets.cases[i].value),
  kalshiTravel: round(hourlyDatasets.travel[i].value),
}));

const span = (s: ChartDataPoint[]) => ({
  from: s[0].date,
  to: s[s.length - 1].date,
  points: s.length,
});
const manifest = {
  built_at: new Date().toISOString(),
  note: "Frozen copy of the H5N1 risk dashboard data. Sources were captured by the Wayback Machine from this site's own API routes between 2025-01-08 and 2025-02-08; the underlying markets have since closed and their APIs no longer serve history.",
  weights: WEIGHTS,
  formula:
    "index = (metaculus*0.5 + kalshiTravel*0.1 + kalshiCases*0.5) / 3, hourly, linear interpolation between source points",
  series: {
    riskIndex: span(index),
    metaculus: {
      ...span(metaculus),
      question:
        "Will CDC report 10,000 or more H5 avian influenza cases in the United States before January 1, 2026?",
      url: "https://www.metaculus.com/questions/30960/",
      resolution: "No",
    },
    kalshiCases: {
      ...span(kalshiCases),
      market:
        "KXH5N1CASES-25-10000: Above 10,000 US bird flu (H5N1) cases in 2025?",
      url: "https://kalshi.com/markets/kxh5n1cases",
      resolution: "No",
    },
    kalshiTravel: {
      ...span(kalshiTravel),
      market:
        "KXCDCTRAVELH5-26-3: Will the CDC recommend delaying non-essential travel due to H5 bird flu before 2026?",
      url: "https://kalshi.com/markets/kxcdctravelh5",
      resolution: "No",
    },
    polymarket: {
      ...span(polymarket),
      market:
        "Another state declare a state of emergency over bird flu before February (2025)?",
      url: "https://polymarket.com/event/another-state-declare-a-state-of-emergency-over-bird-flu-before-february",
      resolution: "No",
    },
    cdc: {
      ...span(cdc),
      source:
        "https://www.cdc.gov/bird-flu/php/avian-flu-summary/chart-epi-curve-ah5n1.html",
      captured: "2025-01-24",
    },
  },
};

const write = (name: string, data: unknown) => {
  writeFileSync(`${OUT}/${name}`, JSON.stringify(data));
  writeFileSync(`${PUB}/${name}`, JSON.stringify(data, null, 1));
};
write("risk_index.json", index);
write("risk_index_components.json", components);
write("metaculus.json", metaculus);
write("kalshi_cases.json", kalshiCases);
write("kalshi_travel.json", kalshiTravel);
write("polymarket.json", polymarket);
write("cdc_monthly.json", cdc);
writeFileSync(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 2));
writeFileSync(`${PUB}/manifest.json`, JSON.stringify(manifest, null, 2));
console.log(JSON.stringify(manifest.series, null, 1));
console.log("last index value", index[index.length - 1]);
