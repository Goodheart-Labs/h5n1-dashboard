"use client";

import { format } from "date-fns";
import { LinkIcon } from "lucide-react";
import { LineGraph } from "@/components/LineGraph";
import { BarGraph } from "@/components/BarGraph";
import { ChartDataPoint } from "@/lib/risk-index/types";
import { WEIGHTS } from "@/lib/risk-index/combineDataSources";

type Component = {
  date: string;
  metaculus: number;
  kalshiCases: number;
  kalshiTravel: number;
};

export type ArchivedSeries = {
  riskIndex: ChartDataPoint[];
  components: Component[];
  metaculus: ChartDataPoint[];
  kalshiCases: ChartDataPoint[];
  kalshiTravel: ChartDataPoint[];
  polymarket: ChartDataPoint[];
  cdc: ChartDataPoint[];
};

function safeFormat(pattern: string) {
  return (date: string) => {
    try {
      return format(new Date(date), pattern);
    } catch {
      return "";
    }
  };
}
const hourLabel = safeFormat("MMM d yyyy - ha 'UTC'");
const dayTick = safeFormat("MMM d");
const monthTick = safeFormat("MMM ''yy");
const monthLabel = safeFormat("MMMM yyyy");
const pct = (v: number) => `${v.toFixed(1)}%`;

function Card({
  title,
  url,
  children,
}: {
  title: string;
  url?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
      <h2 className="mb-2 text-pretty text-xl font-semibold leading-tight tracking-tight text-gray-900 dark:text-gray-100">
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600 dark:hover:text-blue-400"
          >
            {title}
            <LinkIcon className="ml-1 inline-block h-3 w-3 opacity-50" />
          </a>
        ) : (
          title
        )}
      </h2>
      {children}
    </div>
  );
}

export function ArchivedCharts({ series }: { series: ArchivedSeries }) {
  const byDate = new Map(series.components.map((c) => [c.date, c]));
  return (
    <>
      <Card title="H5N1 Risk Index (frozen)">
        <LineGraph
          data={series.riskIndex}
          color="#ef4444"
          label="Risk index value"
          formatValue={pct}
          domain={[0, 100]}
          tickFormatter={dayTick}
          tooltipLabelFormatter={hourLabel}
          tooltipFormatter={(value) => {
            const point = series.riskIndex.find((p) => p.value === value);
            const c = point ? byDate.get(point.date) : undefined;
            return [
              [
                `Risk index value: <b>${value.toFixed(1)}%</b>`,
                `Formed from an average of:`,
                `• 10,000 US cases before 2026: <b>${c ? c.metaculus.toFixed(1) : "-"}%</b> (Metaculus × ${WEIGHTS.metaculus})`,
                `• 10,000 US cases in 2025: <b>${c ? c.kalshiCases.toFixed(1) : "-"}%</b> (Kalshi × ${WEIGHTS.kalshiCases})`,
                `• CDC travel warning before 2026: <b>${c ? c.kalshiTravel.toFixed(1) : "-"}%</b> (Kalshi × ${WEIGHTS.kalshiDelayTravel})`,
              ].join("<br />"),
              "",
            ];
          }}
        />
      </Card>

      <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
        Inputs to the index (all resolved No):
      </h3>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card
          title="Will CDC report 10,000 or more H5 avian influenza cases in the United States before January 1, 2026?"
          url="https://www.metaculus.com/questions/30960/"
        >
          <LineGraph
            data={series.metaculus}
            color="#10b981"
            label="Metaculus community prediction (%)"
            formatValue={pct}
            domain={[0, 100]}
            tickFormatter={dayTick}
            tooltipLabelFormatter={hourLabel}
          />
        </Card>
        <Card
          title="Above 10,000 bird flu (H5N1) cases in the US in 2025?"
          url="https://kalshi.com/markets/kxh5n1cases"
        >
          <LineGraph
            data={series.kalshiCases}
            color="#8b5cf6"
            label="Kalshi price (%)"
            formatValue={pct}
            domain={[0, 100]}
            tickFormatter={dayTick}
            tooltipLabelFormatter={hourLabel}
          />
        </Card>
        <Card
          title="Will the CDC recommend delaying non-essential travel due to H5 bird flu before 2026?"
          url="https://kalshi.com/markets/kxcdctravelh5"
        >
          <LineGraph
            data={series.kalshiTravel}
            color="#8b5cf6"
            label="Kalshi price (%)"
            formatValue={pct}
            domain={[0, 100]}
            tickFormatter={dayTick}
            tooltipLabelFormatter={hourLabel}
          />
        </Card>
        <Card
          title="Another US state (other than California) declares a state of emergency over bird flu before February 2025?"
          url="https://polymarket.com/event/another-state-declare-a-state-of-emergency-over-bird-flu-before-february"
        >
          <LineGraph
            data={series.polymarket}
            color="#3b82f6"
            label="Polymarket price (%)"
            formatValue={pct}
            domain={[0, 100]}
            tickFormatter={dayTick}
            tooltipLabelFormatter={hourLabel}
          />
        </Card>
      </div>

      <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
        Other indicator we showed:
      </h3>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card
          title="Monthly confirmed human H5N1 cases worldwide, 2020 to 2024 (CDC, captured January 2025)"
          url="https://www.cdc.gov/bird-flu/php/avian-flu-summary/chart-epi-curve-ah5n1.html"
        >
          <BarGraph
            data={series.cdc}
            color="#f97316"
            label="Cases"
            formatValue={(v) => v.toString()}
            tickFormatter={monthTick}
            tooltipLabelFormatter={monthLabel}
          />
        </Card>
      </div>
    </>
  );
}
