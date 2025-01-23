"use client";

import { fetchKalshiData } from "../lib/services/kalshi";
import { fetchMetaculusData } from "../lib/services/metaculus";
import {
  getManifoldGroupedData,
  ManifoldGroupedData,
  transformManifoldDataForChart,
} from "../lib/services/manifold-grouped";
import { LinkIcon, ChevronDownIcon } from "lucide-react";
import Image from "next/image";
import * as Collapsible from "@radix-ui/react-collapsible";
import { cn } from "@/lib/utils";
import { MobileFriendlyTooltip } from "@/components/MobileFriendlyTooltip";
import { useEffect, useState } from "react";
import { ChartDataPoint } from "@/lib/types";
import { LineGraph } from "@/components/LineGraph";
import { BarGraph } from "@/components/BarGraph";
import { format } from "date-fns";

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
  const [kalshiData, setKalshiData] = useState<ChartDataPoint[]>([]);
  const [weakAgiData, setWeakAgiData] = useState<ChartDataPoint[]>([]);
  const [fullAgiData, setFullAgiData] = useState<ChartDataPoint[]>([]);
  const [manifoldGroupedData, setManifoldGroupedData] =
    useState<ManifoldGroupedData | null>(null);

  useEffect(() => {
    fetchKalshiData({
      seriesTicker: "KXAITURING",
      marketTicker: "AITURING",
      marketId: "8a66420d-4b3c-446b-bd62-8386637ad844",
      period_interval: 24 * 60,
    })
      .then(setKalshiData)
      .catch((e) => {
        console.error(e);
      });

    fetchMetaculusData(3479)
      .then(setWeakAgiData)
      .catch((e) => {
        console.error(e);
      });

    fetchMetaculusData(5121)
      .then(setFullAgiData)
      .catch((e) => {
        console.error(e);
      });

    getManifoldGroupedData("agi-when-resolves-to-the-year-in-wh-d5c5ad8e4708")
      .then((data) => {
        console.log("Manifold grouped data:", data);
        setManifoldGroupedData(data);
      })
      .catch((e) => {
        console.error(e);
      });
  }, []);

  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr_auto] bg-gray-100 p-6 font-[family-name:var(--font-geist-sans)] text-foreground dark:bg-gray-900">
      <header className="mx-auto mb-8 w-full max-w-6xl text-center">
        <h1 className="my-4 text-2xl font-bold md:text-5xl">
          When will we achieve AGI?{" "}
          <MobileFriendlyTooltip>
            When will we develop artificial general intelligence (AGI) - AI
            systems that match or exceed human-level intelligence across most
            domains?
          </MobileFriendlyTooltip>
        </h1>
      </header>

      <main className="mx-auto w-full max-w-6xl space-y-6">
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Included in index:
        </h3>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="col-span-2 rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
            <GraphTitle
              title="AI passes Turing test before 2030?"
              sourceUrl="https://kalshi.com/markets/kxaituring/ai-turing-test"
              tooltipContent=""
            />
            <LineGraph
              data={kalshiData}
              color="#8b5cf6"
              label="Kalshi Prediction (%)"
              formatValue={(v) => `${v.toFixed(1)}%`}
              tickFormatter={dateFour}
              tooltipLabelFormatter={dateTwo}
              domain={[60, 80]}
            />
          </div>

          <div className="col-span-2 rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
            <GraphTitle
              title="Date Weakly General AI is Publicly Known"
              sourceUrl="https://www.metaculus.com/questions/3479/date-weakly-general-ai-is-publicly-known/"
              tooltipContent="When will we develop artificial general intelligence (AGI) - AI systems that match or exceed human-level intelligence across most domains?"
            />
            <LineGraph
              data={weakAgiData}
              color="#10b981"
              label="Metaculus Prediction (%)"
              formatValue={(v) => `${v.toFixed(1)}%`}
              tickFormatter={dateFour}
              tooltipLabelFormatter={dateTwo}
              domain={[0, 100]}
              showDistribution={true}
            />
          </div>

          <div className="col-span-2 rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
            <GraphTitle
              title="Date of Artificial General Intelligence"
              sourceUrl="https://www.metaculus.com/questions/5121/date-of-artificial-general-intelligence/"
              tooltipContent="When will the first general AI system be devised, tested, and publicly announced?"
            />
            <LineGraph
              data={fullAgiData}
              color="#06b6d4"
              label="Metaculus Prediction (%)"
              formatValue={(v) => `${v.toFixed(1)}%`}
              tickFormatter={dateFour}
              tooltipLabelFormatter={dateTwo}
              domain={[0, 100]}
              showDistribution={true}
            />
          </div>

          <h3 className="col-span-2 mt-6 text-xl font-semibold text-gray-700 dark:text-gray-300">
            Not included in index:
          </h3>

          <div className="col-span-2 rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
            <GraphTitle
              title="When will AGI arrive? (Manifold Markets Distribution)"
              sourceUrl="https://manifold.markets/ManifoldAI/agi-when-resolves-to-the-year-in-wh-d5c5ad8e4708"
              tooltipContent="Distribution of predictions for when AGI will first pass a high-quality Turing test"
            />
            {manifoldGroupedData && (
              <BarGraph
                data={transformManifoldDataForChart(manifoldGroupedData)}
                color="#f97316"
                label="Probability (%)"
                formatValue={(v) => `${v.toFixed(1)}%`}
                tickFormatter={(text) => text}
                tooltipLabelFormatter={(text) => text}
              />
            )}
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
          {/* <form
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
          </form> */}
          {/* {submitStatus === "success" && (
            <p className="mt-2 text-green-600">
              Thanks! We&apos;ll send you an email if the risk levels change
              significantly or if we build another risk dashboard.
            </p>
          )}
          {submitStatus === "error" && (
            <p className="mt-2 text-red-600">
              Something went wrong. Please try again.
            </p>
          )} */}
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
        {/* Poll link temporarily removed while we transition to AGI focus
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
        */}

        <div className="mb-1 text-center">
          <a
            href="https://github.com/Goodheart-Labs/agi-timelines-dashboard"
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

        {/* <p>Last updated: {mounted ? new Date().toLocaleDateString() : ""}</p> */}
      </footer>
    </div>
  );
}

const dateTwo = createSafeDateFormatter("MMM d - HH:mm 'UTC'");
const dateFour = createSafeDateFormatter("MMM d");
// const dateOne = createSafeDateFormatter("MMM d - ha 'UTC'");
// const dateThree = createSafeDateFormatter("MMMM yyyy");
// const dateFive = createSafeDateFormatter("MMM ''yy");
// const dateSix = createSafeDateFormatter("MMM d ha");

// const dateTwo = createSafeDateFormatter("MMM d - HH:mm 'UTC'");
// const dateFour = createSafeDateFormatter("MMM d");

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
