"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ChartDataPoint } from "../lib/risk-index/types";
import {
  fetchPolymarketData,
  fetchMetaculusData,
  fetchKalshiData,
  fetchCdcData,
} from "../lib/services";
import { PREDICTION_MARKETS } from "../lib/config";
import { LineGraph } from "../components/LineGraph";
import { combineDataSources, HourlyDatasets } from "../lib/risk-index/combine";
import { getProbabilityWord, getProbabilityColor } from "@/lib/probabilities";
import { format } from "date-fns";
import { BarGraph } from "@/components/BarGraph";
import { LinkIcon } from "lucide-react";
import { InfoTooltip } from "../components/InfoTooltip";
import Image from "next/image";

function GraphTitle({
  title,
  sourceUrl,
  tooltipContent,
}: {
  title: string;
  sourceUrl?: string;
  tooltipContent?: string;
}) {
  const TitleComponent = sourceUrl ? (
    <a
      href={sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-2"
    >
      <h2 className="text-pretty text-xl font-semibold tracking-tight text-gray-900 group-hover:text-blue-600">
        {title}
        {tooltipContent && <InfoTooltip content={tooltipContent} />}
      </h2>
      <LinkIcon className="mt-2 h-3 w-3 shrink-0 opacity-30 group-hover:opacity-60" />
    </a>
  ) : (
    <h2 className="text-pretty text-xl font-semibold tracking-tight text-gray-900">
      {title}
      {tooltipContent && <InfoTooltip content={tooltipContent} />}
    </h2>
  );

  return (
    <div className="mb-2 grid gap-1">
      <div className="inline-flex items-center gap-1">{TitleComponent}</div>
    </div>
  );
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [polymarketTimeSeries, setPolymarketTimeSeries] = useState<
    ChartDataPoint[]
  >([]);
  const [metaculusTimeSeries, setMetaculusTimeSeries] = useState<
    ChartDataPoint[]
  >([]);
  const [kalshiDelayTravel, setKalshiDelayTravel] = useState<ChartDataPoint[]>(
    [],
  );
  const [cdcTimeSeries, setCdcTimeSeries] = useState<ChartDataPoint[]>([]);
  const [kalshiCases, setKalshiCases] = useState<ChartDataPoint[]>([]);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  useEffect(() => {
    setMounted(true);

    // Load data from services
    fetchPolymarketData(PREDICTION_MARKETS.POLYMARKET.SLUG)
      .then((data) => {
        setPolymarketTimeSeries(data);
      })
      .catch((error) => {
        console.error("Error loading Polymarket data:", error);
      });

    fetchMetaculusData(PREDICTION_MARKETS.METACULUS.QUESTION_ID)
      .then((data) => {
        setMetaculusTimeSeries(data);
      })
      .catch((error) => {
        console.error("Error loading Metaculus data:", error);
      });

    // Kalshi delay travel
    fetchKalshiData({
      marketTicker: "KXCDCTRAVELH5-26-3",
      seriesTicker: "KXCDCTRAVELH5",
      marketId: "d02240fe-5c63-4378-885f-97657e90b783",
    })
      .then((data) => {
        setKalshiDelayTravel(data);
      })
      .catch((error) => {
        console.error("Error loading Kalshi data:", error);
      });

    fetchCdcData()
      .then(setCdcTimeSeries)
      .catch((error) => {
        console.error("Error loading CDC data:", error);
      });

    fetchKalshiData({
      marketTicker: "KXH5N1CASES-25-10000",
      seriesTicker: "KXH5N1CASES",
      marketId: "23d87c35-5c09-4c30-a2b6-842c5b2865de",
    })
      .then((data) => {
        setKalshiCases(data);
      })
      .catch((error) => {
        console.error("Error loading Kalshi cases data:", error);
      });
  }, []);

  // Check the length of each dataset to know when loading is complete
  useEffect(() => {
    if (
      polymarketTimeSeries.length &&
      metaculusTimeSeries.length &&
      kalshiCases.length &&
      kalshiDelayTravel.length
    ) {
      setIsLoading(false);
    }
  }, [
    polymarketTimeSeries,
    metaculusTimeSeries,
    kalshiCases,
    kalshiDelayTravel,
    cdcTimeSeries,
  ]);

  // Calculate combined risk index and interpolated datasets when data updates
  const { riskIndex, hourlyDatasets } = useMemo(() => {
    if (isLoading)
      return { riskIndex: [], hourlyDatasets: {} as HourlyDatasets };

    if (polymarketTimeSeries.length === 0 && metaculusTimeSeries.length === 0) {
      setError("No data available from prediction markets");
      return { riskIndex: [], hourlyDatasets: {} as HourlyDatasets };
    }

    setError(null);
    const { combinedData, hourlyDatasets } = combineDataSources(
      polymarketTimeSeries,
      metaculusTimeSeries,
      kalshiDelayTravel,
      kalshiCases,
    );
    return { riskIndex: combinedData, hourlyDatasets };
  }, [
    isLoading,
    polymarketTimeSeries,
    metaculusTimeSeries,
    kalshiDelayTravel,
    kalshiCases,
  ]);

  if (!mounted) return null;

  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr_auto] bg-gray-100 p-6 font-[family-name:var(--font-geist-sans)]">
      <header className="mx-auto mb-8 w-full max-w-6xl text-center">
        <h1 className="my-4 text-2xl font-bold text-black md:text-5xl">
          Will bird flu be the next COVID?
        </h1>
        <p className="mb-4 text-2xl text-gray-700">
          {isLoading ? (
            "Loading risk assessment..."
          ) : error ? (
            <span className="text-red-500">{error}</span>
          ) : (
            <>
              <span
                className={`mb-4 block text-6xl font-bold ${getProbabilityColor(
                  riskIndex[riskIndex.length - 1].value / 100,
                )}`}
              >
                {getProbabilityWord(
                  riskIndex[riskIndex.length - 1].value / 100,
                )}
              </span>{" "}
              Our risk index gives it{" "}
              {riskIndex[riskIndex.length - 1].value.toFixed(0)} out of 100
              (about {riskIndex[riskIndex.length - 1].value.toFixed(0)}%) on{" "}
              <span className="inline-flex items-center">
                {format(new Date(), "MMMM d, yyyy")}
                <InfoTooltip content="The index is an average of predictions from Polymarket, Metaculus, and Kalshi. Polymarket and Kalshi are real money prediction markets. Metaculus is a forecasting community with a good track record." />
              </span>
            </>
          )}
        </p>
      </header>

      <main className="mx-auto w-full max-w-6xl space-y-6">
        <div className="rounded-lg bg-white p-6 shadow-lg">
          <GraphTitle
            title="H5N1 Risk Index"
            tooltipContent={`Combined prediction from multiple sources:
• Polymarket: Will a US state declare emergency? * .1
• Metaculus: Will CDC report 10,000+ cases by 2026?
• Kalshi Travel: Will CDC recommend delaying travel? * .25
• Kalshi Cases: Will there be 1000+ cases this year? * .3`}
          />
          <LineGraph
            data={riskIndex}
            color="#ef4444"
            label="Risk index value"
            formatValue={(v) => `${v.toFixed(1)}%`}
            domain={[0, 100]}
            tooltipFormatter={(value) => {
              const point = riskIndex.find((p) => p.value === value);
              if (!point?.date)
                return [value.toFixed(1) + "%", "Risk index value"];

              const poly = hourlyDatasets.poly?.find(
                (p) => p.date === point.date,
              );
              const meta = hourlyDatasets.meta?.find(
                (p) => p.date === point.date,
              );
              const kalshiT = hourlyDatasets.travel?.find(
                (p) => p.date === point.date,
              );
              const kalshiC = hourlyDatasets.cases?.find(
                (p) => p.date === point.date,
              );

              return [
                [
                  `Risk index value: <b>${value.toFixed(1)}%</b>`,
                  `Formed from an average of:`,
                  `• US state emergency before Feb: <b>${poly ? (poly.value * 0.1).toFixed(1) : "-"}%</b> (Polymarket × 0.1)`,
                  `• 10,000 US cases before 2026: <b>${meta ? meta.value.toFixed(1) : "-"}%</b> (Metaculus)`,
                  `• 1,000 US cases this year: <b>${kalshiC ? (kalshiC.value * 0.3).toFixed(1) : "-"}%</b> (Kalshi × 0.3)`,
                  `• CDC travel warning before 2026: <b>${kalshiT ? (kalshiT.value * 0.25).toFixed(1) : "-"}%</b> (Kalshi × 0.25)`,
                ].join("<br />"),
                "",
              ];
            }}
          />
        </div>

        <h3 className="text-xl font-semibold text-gray-700">
          Included in index:
        </h3>

        {/* Grid of smaller graphs */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <GraphTitle
              title="Another a US state other than California declare a state of emergency over bird flu before February?"
              sourceUrl="https://polymarket.com/event/another-state-declare-a-state-of-emergency-over-bird-flu-before-february"
              tooltipContent="A state of emergence gives the Governor additional powers. It doesn't imply lockdowns or similar."
            />
            <LineGraph
              data={polymarketTimeSeries}
              color="#3b82f6"
              label="Polymarket Prediction (%)"
              formatValue={(v) => `${v.toFixed(1)}%`}
              domain={[0, 100]}
            />
          </div>

          <div className="rounded-lg bg-white p-6 shadow-lg">
            <GraphTitle
              title="Will CDC report 10,000 or more H5 avian influenza cases in the United States before January 1, 2026?"
              sourceUrl="https://www.metaculus.com/questions/30960/?sub-question=30732"
              tooltipContent=""
            />
            <LineGraph
              data={metaculusTimeSeries}
              color="#10b981"
              label="Metaculus Prediction (%)"
              formatValue={(v) => `${v.toFixed(1)}%`}
              domain={[0, 100]}
            />
          </div>

          <div className="rounded-lg bg-white p-6 shadow-lg">
            <GraphTitle
              title="Will the CDC recommend delaying non-essential travel due to H5 bird flu before 2026?"
              sourceUrl="https://kalshi.com/markets/kxcdctravelh5/avian-flu-travel-warning"
              tooltipContent=""
            />
            <LineGraph
              data={kalshiDelayTravel}
              color="#8b5cf6"
              label="Kalshi Prediction (%)"
              formatValue={(v) => `${v.toFixed(1)}%`}
              tooltipLabelFormatter={(date) =>
                format(new Date(date), "MM/dd ha")
              }
              domain={[0, 100]}
            />
          </div>

          <div className="rounded-lg bg-white p-6 shadow-lg">
            <GraphTitle
              title="Above 10,000 Bird Flu (H5N1) cases this year?"
              sourceUrl="https://kalshi.com/markets/kxh5n1cases/h5n1-cases"
              tooltipContent=""
            />
            <LineGraph
              data={kalshiCases}
              color="#8b5cf6"
              label="Kalshi Prediction (%)"
              formatValue={(v) => `${v.toFixed(1)}%`}
              tooltipLabelFormatter={(date) =>
                format(new Date(date), "MM/dd ha")
              }
              domain={[0, 100]}
            />
          </div>

          <h3 className="text-xl font-semibold text-gray-700">
            Not included in index:
          </h3>

          <div className="col-span-full rounded-lg bg-white p-6 shadow-lg">
            <GraphTitle
              title="Monthly H5N1 Cases Worldwide"
              sourceUrl="https://www.cdc.gov/bird-flu/php/avian-flu-summary/chart-epi-curve-ah5n1.html"
              tooltipContent="Official CDC data on confirmed H5N1 cases"
            />
            <BarGraph
              data={cdcTimeSeries}
              color="#f97316"
              label="Cases"
              formatValue={(v) => v.toString()}
              tickFormatter={(date) => format(new Date(date), "MMM ''yy")}
              tooltipLabelFormatter={(date) =>
                format(new Date(date), "MMMM yyyy")
              }
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mx-auto mt-8 w-full max-w-6xl text-center text-sm text-gray-500">
        <div className="mb-8 rounded-lg bg-white p-6 shadow-lg">
          <h3 className="mb-2 text-lg font-semibold text-black">
            Stay Updated
          </h3>
          <p className="mb-4 text-gray-600">
            Get updated on if H5N1 risk levels change significantly or other
            risk dashboards. Your email will not be used for other purposes.
          </p>
          <form
            className="mx-auto flex max-w-md flex-col gap-2 sm:flex-row"
            onSubmit={async (e) => {
              e.preventDefault();
              const email = (e.target as HTMLFormElement).email.value;

              try {
                const res = await fetch("/api/email", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email }),
                });

                if (!res.ok) throw new Error();

                setSubmitStatus("success");
                (e.target as HTMLFormElement).reset();
              } catch {
                setSubmitStatus("error");
              }
            }}
          >
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              className="flex-1 rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              className="rounded-md bg-blue-500 px-6 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Subscribe
            </button>
          </form>
          {submitStatus === "success" && (
            <p className="mt-2 text-green-600">
              Thanks! We&apos;ll send you updates.
            </p>
          )}
          {submitStatus === "error" && (
            <p className="mt-2 text-red-600">
              Something went wrong. Please try again.
            </p>
          )}
        </div>
        <div className="mb-8 text-gray-600">
          <p className="mb-2">
            If you want to vote for other things to be included in the index or
            to see other data sources on this site,{" "}
            <a
              href="#"
              className="text-blue-500 underline hover:text-blue-600"
              onClick={(e) => {
                e.preventDefault();
                alert("Poll coming soon!");
              }}
            >
              please vote using this 2 minute poll
            </a>
          </p>
        </div>
        <div className="mb-4 flex items-center justify-center gap-2">
          <span className="flex items-center gap-2">
            Built by
            <a
              href="https://x.com/NathanpmYoung"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-blue-600"
            >
              Nathan Young
              <Image
                src="https://unavatar.io/twitter/NathanpmYoung"
                alt="Nathan Young"
                className="rounded-full"
                width={24}
                height={24}
              />
            </a>
          </span>
          <span>and</span>
          <span className="flex items-center gap-2">
            <a
              href="https://x.com/tone_row_"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-blue-600"
            >
              Rob Gordon
              <Image
                src="https://unavatar.io/twitter/tone_row_"
                alt="Rob Gordon"
                className="rounded-full"
                width={24}
                height={24}
              />
            </a>
            <a
              href="https://github.com/Goodheart-Labs/h5n1-dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600"
            >
              View the source code on GitHub
            </a>
          </span>
        </div>
        <p className="mb-4 text-gray-600">
          If you want to support more work like this,{" "}
          <a
            href="https://nathanpmyoung.substack.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600"
          >
            buy a paid subscription to Predictive Text
          </a>
        </p>

        <p>Last updated: {mounted ? new Date().toLocaleDateString() : ""}</p>
      </footer>
    </div>
  );
}
