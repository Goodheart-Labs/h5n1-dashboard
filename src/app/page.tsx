import { getLiveMarkets, LiveMarket } from "@/lib/live-markets";
import { getProbabilityWord, getProbabilityColor } from "@/lib/probabilities";
import { ArchivedCharts } from "@/components/ArchivedCharts";
import { Faq } from "@/components/Faq";
import { LinkIcon } from "lucide-react";
import riskIndex from "@/data/archive/risk_index.json";
import components from "@/data/archive/risk_index_components.json";
import metaculus from "@/data/archive/metaculus.json";
import kalshiCases from "@/data/archive/kalshi_cases.json";
import kalshiTravel from "@/data/archive/kalshi_travel.json";
import polymarket from "@/data/archive/polymarket.json";
import cdc from "@/data/archive/cdc_monthly.json";
import manifest from "@/data/archive/manifest.json";

// Live market numbers are re-fetched at most hourly; everything else is static.
export const revalidate = 3600;

const RAW_DOWNLOADS = [
  {
    name: "Metaculus history (8 Feb 2025 capture)",
    path: "/archive/raw/wayback/metaculus_30960_20250208.json",
  },
  {
    name: "Kalshi 10,000-cases candlesticks (8 Feb 2025 capture)",
    path: "/archive/raw/wayback/kalshi_cases_20250208.json",
  },
  {
    name: "Kalshi travel-warning candlesticks (8 Feb 2025 capture)",
    path: "/archive/raw/wayback/kalshi_travel_20250208.json",
  },
  {
    name: "Polymarket state-of-emergency price history",
    path: "/archive/raw/wayback/polymarket_timeseries_20250208.json",
  },
  {
    name: "CDC monthly cases table (24 Jan 2025 capture)",
    path: "/archive/raw/wayback/cdc_data_20250124.json",
  },
  {
    name: "Rebuilt index and inputs: manifest with provenance",
    path: "/archive/data/manifest.json",
  },
  { name: "Rebuilt index, hourly", path: "/archive/data/risk_index.json" },
];

const utcDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
const utcMonth = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    year: "numeric",
  });
const utcStamp = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }) + " UTC";

function pct(p: number | null) {
  return p == null ? "–" : `${Math.round(p * 100)}%`;
}

function MarketCard({ m }: { m: LiveMarket }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-white p-5 shadow-lg dark:bg-gray-800">
      <div className="flex items-start justify-between gap-3">
        <a
          href={m.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group"
        >
          <h3 className="text-pretty font-semibold leading-tight text-gray-900 group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-400">
            {m.title}
            <LinkIcon className="ml-1 inline-block h-3 w-3 opacity-50" />
          </h3>
        </a>
        <span
          className={`shrink-0 text-2xl ${m.probability == null ? "text-gray-400" : getProbabilityColor(m.probability)}`}
        >
          {pct(m.probability)}
        </span>
      </div>
      {m.rows && (
        <table className="text-sm text-gray-700 dark:text-gray-300">
          <tbody>
            {m.rows.map((r) => (
              <tr key={r.label}>
                <td className="pr-4">{r.label}</td>
                <td className="text-right font-mono">{pct(r.probability)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {m.source}
        {m.closes ? ` · closes ${utcMonth(m.closes)}` : ""}
        {m.note ? ` · ${m.note}` : ""}
      </p>
    </div>
  );
}

export default async function Home() {
  const { markets, fetchedAt } = await getLiveMarkets();
  const last = riskIndex[riskIndex.length - 1];
  const lastDate = utcDate(last.date);
  const captureFrom = utcDate(manifest.series.riskIndex.from);

  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr_auto] bg-gray-100 p-6 font-[family-name:var(--font-geist-sans)] text-foreground dark:bg-gray-900">
      <header className="mx-auto mb-8 w-full max-w-6xl text-center">
        <div
          role="status"
          className="mx-auto mb-6 max-w-3xl rounded-lg border border-amber-300 bg-amber-50 p-4 text-left text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"
        >
          <p className="font-semibold">
            This dashboard is not currently tracking.
          </p>
          <p className="mt-1 text-sm">
            The markets behind the risk index closed at the end of 2025 and all
            resolved No. The charts are frozen at the last data we captured,{" "}
            {lastDate}. Open markets that still say something about bird flu are
            listed below and refresh hourly.
          </p>
        </div>
        <h1 className="my-4 text-2xl font-bold md:text-5xl">
          Will bird flu be the next COVID?
        </h1>
        <p className="mb-4 text-2xl text-gray-700 dark:text-gray-300">
          <span
            className={`mb-4 block text-4xl font-bold sm:text-6xl ${getProbabilityColor(last.value / 100)}`}
          >
            {getProbabilityWord(last.value / 100)}
          </span>
          The index last read {last.value.toFixed(0)} out of 100 (about{" "}
          {last.value.toFixed(0)}%) on {lastDate}.
        </p>
      </header>

      <main className="mx-auto w-full max-w-6xl space-y-6">
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
              What open markets say now
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Shown as they are, not combined into an index. Most are broader
              than H5N1. A dash means the source did not answer. Fetched{" "}
              {utcStamp(fetchedAt)}.
            </p>
          </div>
          {markets.length ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {markets.map((m) => (
                <MarketCard key={m.url} m={m} />
              ))}
            </div>
          ) : (
            <p className="rounded-lg bg-white p-5 text-gray-600 shadow-lg dark:bg-gray-800 dark:text-gray-300">
              None of the market APIs answered just now. Try again in an hour.
            </p>
          )}
        </section>

        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
              The archived index, {captureFrom} to {lastDate}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Rebuilt from Wayback Machine captures of this site&apos;s own data
              feeds, using the original formula.
            </p>
          </div>
          <ArchivedCharts
            series={{
              riskIndex,
              components,
              metaculus,
              kalshiCases,
              kalshiTravel,
              polymarket,
              cdc,
            }}
          />
        </section>

        <section className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
          <h3 className="mb-3 text-xl font-semibold">Download the data</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700 dark:text-gray-300">
            {RAW_DOWNLOADS.map((d) => (
              <li key={d.path}>
                <a
                  href={d.path}
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  {d.name}
                </a>
              </li>
            ))}
            <li>
              <a
                href="https://github.com/Goodheart-Labs/h5n1-dashboard/tree/main/public/archive/raw"
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                Every capture, on GitHub
              </a>
            </li>
          </ul>
        </section>

        <section className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
          <h3 className="mb-6 text-2xl font-semibold">
            Frequently Asked Questions
          </h3>
          <Faq />
        </section>
      </main>

      <footer className="mx-auto mt-8 w-full max-w-6xl space-y-1 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>
          <a
            href="https://github.com/Goodheart-Labs/h5n1-dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600"
          >
            Source code on GitHub
          </a>
        </p>
        <p>
          Built by{" "}
          <a
            href="https://x.com/NathanpmYoung"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600"
          >
            Nathan Young
          </a>{" "}
          and{" "}
          <a
            href="https://x.com/tone_row_"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600"
          >
            Rob Gordon
          </a>{" "}
          of{" "}
          <a
            href="https://goodheartlabs.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600"
          >
            Goodheart Labs
          </a>
          . Launched January 2025, frozen February 2025, archived September
          2026.
        </p>
        <p>
          More work like this:{" "}
          <a
            href="https://nathanpmyoung.substack.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600"
          >
            Predictive Text
          </a>
        </p>
      </footer>
    </div>
  );
}
