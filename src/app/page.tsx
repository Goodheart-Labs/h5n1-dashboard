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
import {
  combineDataSources,
  HourlyDatasets,
  WEIGHTS,
} from "../lib/risk-index/combineDataSources";
import { getProbabilityWord, getProbabilityColor } from "@/lib/probabilities";
import { format } from "date-fns";
import { BarGraph } from "@/components/BarGraph";
import {
  LinkIcon,
  ChevronDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "lucide-react";
import Image from "next/image";
import * as Collapsible from "@radix-ui/react-collapsible";
import { cn } from "@/lib/utils";
import { MobileFriendlyTooltip } from "@/components/MobileFriendlyTooltip";

function GraphTitle({
  title,
  sourceUrl,
  tooltipContent,
  children,
}: {
  title: string;
  sourceUrl?: string;
  tooltipContent?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const sharedClasses =
    "text-pretty text-xl font-semibold leading-tight tracking-tight text-gray-900 dark:text-gray-100";
  const TitleComponent = sourceUrl ? (
    <a
      href={sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group"
    >
      <h2
        className={cn(
          sharedClasses,
          "group-hover:text-blue-600 dark:group-hover:text-blue-400",
        )}
      >
        {title}
        <LinkIcon className="ml-1 inline-block h-3 w-3 opacity-50 group-hover:opacity-60" />
      </h2>
    </a>
  ) : (
    <h2 className={sharedClasses}>{title}</h2>
  );

  return (
    <div className="mb-2 grid gap-1">
      <div className="inline-flex items-center justify-between gap-1">
        <div className="flex w-full items-center justify-start gap-2">
          {TitleComponent}
          {children}
        </div>
        {tooltipContent && (
          <MobileFriendlyTooltip>{tooltipContent}</MobileFriendlyTooltip>
        )}
      </div>
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
  const { riskIndex, hourlyDatasets, pointMovement } = useMemo(() => {
    if (isLoading)
      return {
        riskIndex: [],
        hourlyDatasets: {} as HourlyDatasets,
        pointMovement: 0,
      };

    if (metaculusTimeSeries.length === 0) {
      setError("No data available from prediction markets");
      return {
        riskIndex: [],
        hourlyDatasets: {} as HourlyDatasets,
        pointMovement: 0,
      };
    }

    setError(null);
    return combineDataSources(
      metaculusTimeSeries,
      kalshiDelayTravel,
      kalshiCases,
    );
  }, [isLoading, metaculusTimeSeries, kalshiDelayTravel, kalshiCases]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen">
      <header className="mx-auto w-full max-w-6xl text-center">
        <h1 className="mb-4 mt-2 text-2xl font-bold md:text-5xl">
          Will bird flu be the next COVID?{" "}
          <MobileFriendlyTooltip>
            Will bird flu have an impact on people&apos;s lives on the same
            order of magnitude as covid? Will it cause a random person huge
            personal inconvenience?
          </MobileFriendlyTooltip>
        </h1>
        <p className="mb-4 min-h-[108px] text-2xl text-gray-700 dark:text-gray-300">
          {isLoading ? (
            "Loading risk assessment..."
          ) : error ? (
            <span className="text-red-500">{error}</span>
          ) : (
            <>
              <span
                className={`mb-4 block text-4xl font-bold sm:text-6xl ${getProbabilityColor(
                  riskIndex[riskIndex.length - 1].value / 100,
                )}`}
              >
                {getProbabilityWord(
                  riskIndex[riskIndex.length - 1].value / 100,
                )}
              </span>{" "}
              Our risk index gives it{" "}
              {riskIndex[riskIndex.length - 1].value.toFixed(0)} out of 100
              (about {riskIndex[riskIndex.length - 1].value.toFixed(0)}%) as of{" "}
              <span className="inline-flex items-center">
                {format(new Date(), "MMMM d, yyyy")}
                <MobileFriendlyTooltip>
                  The index is an average of predictions from Polymarket,
                  Metaculus, and Kalshi. Polymarket and Kalshi are real money
                  prediction markets. Metaculus is a forecasting community with
                  a good track record.
                </MobileFriendlyTooltip>
              </span>
            </>
          )}
        </p>
      </header>

      <main className="mx-auto w-full max-w-6xl space-y-6">
        <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
          <GraphTitle
            title="H5N1 Risk Index"
            tooltipContent={
              <div className="space-y-2">
                <p>
                  Weighted average of multiple sources (below is each source and
                  its weighting):
                </p>
                <ul className="list-none space-y-1.5">
                  <li>
                    <span className="font-medium">Metaculus</span>: Will CDC
                    report 10,000+ cases by 2026?{" "}
                    <span className="opacity-75">× {WEIGHTS.metaculus}</span>
                  </li>
                  <li>
                    <span className="font-medium">Kalshi Travel</span>: Will CDC
                    recommend delaying travel?{" "}
                    <span className="opacity-75">
                      × {WEIGHTS.kalshiDelayTravel}
                    </span>
                  </li>
                  <li>
                    <span className="font-medium">Kalshi Cases</span>: Will
                    there be 10,000+ cases this year?{" "}
                    <span className="opacity-75">× {WEIGHTS.kalshiCases}</span>
                  </li>
                </ul>
              </div>
            }
          >
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-base",
                Number(pointMovement) >= 0
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                  : "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
              )}
            >
              {Number(pointMovement) >= 0 ? (
                <ArrowUpIcon className="h-4 w-4" />
              ) : (
                <ArrowDownIcon className="h-4 w-4" />
              )}
              <span>{Math.abs(Number(pointMovement))} 24h</span>
            </div>
          </GraphTitle>
          <LineGraph
            data={riskIndex}
            color="#ef4444"
            label="Risk index value"
            formatValue={(v) => `${v.toFixed(1)}%`}
            domain={[0, 100]}
            tickFormatter={dateSix}
            tooltipLabelFormatter={dateOne}
            tooltipFormatter={(value) => {
              const point = riskIndex.find((p) => p.value === value);
              if (!point?.date)
                return [value.toFixed(1) + "%", "Risk index value"];

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
                  `• 10,000 US cases before 2026: <b>${meta ? meta.value.toFixed(1) : "-"}%</b> (Metaculus × ${WEIGHTS.metaculus})`,
                  `• 10,000 US cases this year: <b>${kalshiC ? kalshiC.value.toFixed(1) : "-"}%</b> (Kalshi × ${WEIGHTS.kalshiCases})`,
                  `• CDC travel warning before 2026: <b>${kalshiT ? kalshiT.value.toFixed(1) : "-"}%</b> (Kalshi × ${WEIGHTS.kalshiDelayTravel})`,
                ].join("<br />"),
                "",
              ];
            }}
          />
        </div>

        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Included in index:
        </h3>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
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
              tickFormatter={dateFour}
              tooltipLabelFormatter={dateFour}
            />
          </div>

          <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
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
              tickFormatter={dateFour}
              tooltipLabelFormatter={dateTwo}
              domain={[0, 100]}
            />
          </div>

          <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
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
              tickFormatter={dateFour}
              tooltipLabelFormatter={dateTwo}
              domain={[0, 100]}
            />
          </div>
        </div>

        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Other useful indicators:
        </h3>

        {/* Grid of smaller graphs */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
            <GraphTitle
              title="Another US State other than California declare a state of emergency over bird flu before February?"
              sourceUrl="https://polymarket.com/event/another-state-declare-a-state-of-emergency-over-bird-flu-before-february"
              tooltipContent="A state of emergence gives the Governor additional powers. It doesn't necessarily imply lockdowns or similar."
            />
            <LineGraph
              data={polymarketTimeSeries}
              color="#3b82f6"
              label="Polymarket Prediction (%)"
              formatValue={(v) => `${v.toFixed(1)}%`}
              domain={[0, 100]}
              tickFormatter={dateFour}
              tooltipLabelFormatter={dateFour}
            />
          </div>

          <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
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
              tickFormatter={dateFive}
              tooltipLabelFormatter={dateThree}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mx-auto mt-8 w-full max-w-6xl text-center text-sm text-gray-500 dark:text-gray-400">
        <div className="mb-8 rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
          <h3 className="mb-2 text-lg font-semibold">Stay Updated</h3>
          <p className="mb-4 text-gray-600 dark:text-gray-300">
            Get updated on if H5N1 risk levels change significantly or if we
            build another dashboard for some comparable risk. Your email will
            not be used for other purposes.
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
              className="flex-1 rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              required
            />
            <button
              type="submit"
              className="rounded-md bg-blue-500 px-6 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Update Me
            </button>
          </form>
          {submitStatus === "success" && (
            <p className="mt-2 text-green-600">
              Thanks! We&apos;ll send you an email if the risk levels change
              significantly or if we build another risk dashboard.
            </p>
          )}
          {submitStatus === "error" && (
            <p className="mt-2 text-red-600">
              Something went wrong. Please try again.
            </p>
          )}
        </div>
        <div className="mb-8 mt-8 rounded-lg bg-white p-6 text-left shadow-lg dark:bg-gray-800">
          <h3 className="mb-6 text-2xl font-semibold">
            Frequently Asked Questions
          </h3>

          <div className="space-y-4">
            <Collapsible.Root className="rounded border border-gray-200 dark:border-gray-700">
              <Collapsible.Trigger className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 dark:hover:text-gray-100">
                <h4 className="text-lg font-medium">
                  How is the risk index calculated?
                </h4>
                <ChevronDownIcon className="h-5 w-5 text-gray-500 transition-transform duration-200 ease-in-out group-data-[state=open]:rotate-180" />
              </Collapsible.Trigger>
              <Collapsible.Content className="overflow-hidden data-[state=closed]:animate-slideUp data-[state=open]:animate-slideDown">
                <div className="space-y-4 border-t border-gray-200 p-4 text-gray-600 dark:border-gray-700 dark:text-gray-300">
                  <p>
                    We have three individual data sources that relate to whether
                    bird flu will be bad, but even if they all resolve positive,
                    we might only have something like winter flu.
                  </p>
                  <p>
                    As a result I, Nathan Young, have used my professional
                    judgement as a forecaster, to assign a conditional
                    probability to each datasource that if it resolves positive,
                    the actual central question does.
                  </p>
                  <p className="font-mono text-sm">
                    ie P(bird flu as bad as covid) = P(bird flu as bad as covid
                    | 10,000 US cases) x P(10,000 US cases)
                  </p>
                  <p>
                    If this page gets lots of traffic, I will crowdsource P(bird
                    flu as bad as covid | 10,000 US cases), but as it is, I made
                    a guess.
                  </p>
                  <p>
                    Next we have three of these, and I have taken the average.
                  </p>
                  <p>So the full forecast is as follows:</p>
                  <p className="whitespace-pre-wrap font-mono text-sm">
                    Index = ( Nathan&apos;s estimate of P(bird flu as bad as
                    covid | 10,000 US cases) × Current Metaculus P(10,000 US
                    cases) + Nathan&apos;s estimate of P(bird flu as bad as
                    covid | 10,000 US cases) × Current Kalshi P(10,000 US cases)
                    + Nathan&apos;s estimate of P(bird flu as bad as covid | CDC
                    travel advisory) × Current Kalshi P(CDC travel advisory) ) ÷
                    3
                  </p>
                  <p>The weights are .5, .5 and .1 respectively.</p>
                  <p>
                    I may be wrong here, but I really do not think a straight or
                    weighted average is the right answer. I agree that I should
                    take some group median on these made up values.
                  </p>
                </div>
              </Collapsible.Content>
            </Collapsible.Root>
          </div>
        </div>
        <div className="mb-8 text-gray-600 dark:text-gray-300">
          <p className="mb-2">
            If you want to vote for other things to be included in the index or
            to see other data sources on this site,{" "}
            <a
              href="https://viewpoints.xyz/polls/h5n1-dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline hover:text-blue-600"
            >
              please vote using this 2 minute poll
            </a>
          </p>
        </div>

        <div className="mb-1 text-center">
          <a
            href="https://github.com/Goodheart-Labs/h5n1-dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600"
          >
            View the source code on GitHub
          </a>
        </div>
        <div className="mb-1 text-gray-600 dark:text-gray-300">
          If you want to support more work like this,{" "}
          <a
            href="https://nathanpmyoung.substack.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600"
          >
            buy a paid subscription to Predictive Text
          </a>
        </div>
        <div className="mb-1 flex flex-col items-center gap-2">
          <p className="text-gray-600 dark:text-gray-300">
            If you want more people to see this dashboard today, a vote on
            Product Hunt would help
          </p>
          <a
            href="https://www.producthunt.com/posts/bird-flu-risk-dashboard?embed=true&utm_source=badge-featured&utm_medium=badge&utm_souce=badge-bird&#0045;flu&#0045;risk&#0045;dashboard"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=766429&theme=light"
              alt="Bird Flu Risk Dashboard - Little chance of it being the next Covid | Product Hunt"
              width={250}
              height={54}
              style={{ width: "250px", height: "54px" }}
            />
          </a>
        </div>

        <div className="mb-1">
          Built by&nbsp;
          <span className="inline-flex items-center gap-2">
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
          <span>&nbsp;and&nbsp;</span>
          <span className="inline-flex items-center">
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
            <span>&nbsp;of&nbsp;</span>
            <a
              href="https://goodheartlabs.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600"
            >
              Goodheart Labs
            </a>
          </span>
        </div>

        <span>&nbsp;</span>

        <p>Last updated: {mounted ? new Date().toLocaleDateString() : ""}</p>
      </footer>
    </div>
  );
}

const dateOne = createSafeDateFormatter("MMM d - ha 'UTC'");
const dateTwo = createSafeDateFormatter("MMM d - HH:mm 'UTC'");
const dateThree = createSafeDateFormatter("MMMM yyyy");
const dateFour = createSafeDateFormatter("MMM d");
const dateFive = createSafeDateFormatter("MMM ''yy");
const dateSix = createSafeDateFormatter("MMM d ha");

/**
 * This creates a safe date formatter that fails silently,
 * and returns an empty string if the date is invalid.
 */
function createSafeDateFormatter(dateFormat: string) {
  return (date: string) => {
    try {
      return format(new Date(date), dateFormat);
    } catch {
      return "";
    }
  };
}
