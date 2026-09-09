// Pull Kalshi market detail + full hourly candlesticks (authed). Run: bun archive/kalshi-pull.ts
import crypto from "crypto";
import { readFileSync, writeFileSync } from "fs";

const env: Record<string, string> = {};
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, "");
}
const privateKey = [
  "-----BEGIN RSA PRIVATE KEY-----",
  ...env.KALSHI_PRIVATE_KEY.split("\\n"),
  "-----END RSA PRIVATE KEY-----",
].join("\n");

async function kalshi(
  base: string,
  path: string,
  query: Record<string, string | number> = {},
) {
  const qs = Object.keys(query).length
    ? "?" +
      new URLSearchParams(Object.entries(query).map(([k, v]) => [k, String(v)]))
    : "";
  const ts = Date.now().toString();
  const sig = crypto
    .sign("sha256", Buffer.from(ts + "GET" + path + qs), {
      key: crypto.createPrivateKey(privateKey),
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
    })
    .toString("base64");
  const r = await fetch(base + path + qs, {
    headers: {
      "KALSHI-ACCESS-KEY": env.KALSHI_ACCESS_KEY,
      "KALSHI-ACCESS-SIGNATURE": sig,
      "KALSHI-ACCESS-TIMESTAMP": ts,
    },
  });
  const text = await r.text();
  if (!r.ok)
    throw new Error(`${r.status} ${base + path + qs} ${text.slice(0, 200)}`);
  return JSON.parse(text);
}

const V2 = "https://api.elections.kalshi.com/trade-api/v2";
const V1 = "https://api.elections.kalshi.com/v1";
const markets = [
  {
    ticker: "KXH5N1CASES-25-10000",
    series: "KXH5N1CASES",
    id: "23d87c35-5c09-4c30-a2b6-842c5b2865de",
    name: "kalshi_cases_10000_2025",
  },
  {
    ticker: "KXCDCTRAVELH5-26-3",
    series: "KXCDCTRAVELH5",
    id: "d02240fe-5c63-4378-885f-97657e90b783",
    name: "kalshi_cdc_travel_before_2026",
  },
];
async function main() {
  for (const m of markets) {
    let detail: unknown = null;
    try {
      detail = await kalshi(V2, `/markets/${m.ticker}`);
      console.log(m.ticker, "detail ok", JSON.stringify(detail).slice(0, 300));
    } catch (e) {
      console.log(m.ticker, "detail FAILED", String(e).slice(0, 200));
    }
    const open = (detail as any)?.market?.open_time
      ? new Date((detail as any).market.open_time)
      : new Date("2024-11-01T00:00:00Z");
    const close = (detail as any)?.market?.close_time
      ? new Date((detail as any).market.close_time)
      : new Date("2026-01-08T00:00:00Z");
    const start_ts = Math.floor(open.getTime() / 1000) - 3600;
    const end_ts = Math.min(
      Math.floor(close.getTime() / 1000) + 3600,
      Math.floor(Date.now() / 1000),
    );
    let candles: unknown = null;
    for (const [base, path] of [
      [V1, `/series/${m.series}/markets/${m.id}/candlesticks`],
      [V2, `/series/${m.series}/markets/${m.ticker}/candlesticks`],
    ] as const) {
      try {
        candles = await kalshi(base, path, {
          start_ts,
          end_ts,
          period_interval: 60,
        });
        const n = (candles as any)?.candlesticks?.length;
        console.log(m.ticker, "candles ok via", base, "n=", n);
        break;
      } catch (e) {
        console.log(
          m.ticker,
          "candles FAILED via",
          base,
          String(e).slice(0, 200),
        );
      }
    }
    writeFileSync(
      `archive/raw/kalshi/${m.name}.json`,
      JSON.stringify(
        {
          pulled_at: new Date().toISOString(),
          request: { ...m, start_ts, end_ts },
          detail,
          candles,
        },
        null,
        1,
      ),
    );
  }
}
main();
