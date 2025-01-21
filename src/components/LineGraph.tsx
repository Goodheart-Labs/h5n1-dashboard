import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartDataPoint } from "../lib/risk-index/types";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  formatter: (value: number) => [string, string];
  labelFormatter: (date: string) => string;
}

function CustomTooltip({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
}: CustomTooltipProps) {
  if (!active || !payload || !payload[0]) return null;

  const [content] = formatter(payload[0].value);
  const lines = content.split("<br />");

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <p className="mb-2 font-medium text-gray-900 dark:text-gray-100">
        {labelFormatter(label || "")}
      </p>
      {lines.map((line, i) => {
        // Extract the number between <b> tags if it exists
        const match = line.match(/<b>(.*?)<\/b>/);
        if (match) {
          const [fullMatch, number] = match;
          const [before, after] = line.split(fullMatch);
          return (
            <p
              key={i}
              className="whitespace-nowrap text-gray-700 dark:text-gray-300"
            >
              {before}
              <span className="font-bold">{number}</span>
              {after}
            </p>
          );
        }
        return (
          <p
            key={i}
            className="whitespace-nowrap text-gray-700 dark:text-gray-300"
          >
            {line}
          </p>
        );
      })}
    </div>
  );
}

export interface LineGraphProps {
  data: ChartDataPoint[];
  color: string;
  label: string;
  formatValue?: (value: number) => string;
  tickFormatter: (date: string) => string;
  tooltipFormatter?: (value: number) => [string, string];
  tooltipLabelFormatter: (date: string) => string;
  domain?: [number, number];
}

export function LineGraph({
  data,
  color,
  label,
  formatValue = (v: number) => v.toString(),
  tickFormatter,
  tooltipFormatter = (value: number) => [formatValue(value), label],
  tooltipLabelFormatter,
  domain,
}: LineGraphProps) {
  return (
    <div className="relative h-[320px] w-full">
      <div className="absolute left-0 top-0 text-sm text-gray-500 dark:text-gray-400">
        {label}
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 40,
            right: 16,
            left: 16,
            bottom: 40,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="currentColor"
            opacity={0.1}
          />
          <XAxis
            dataKey="date"
            tick={{
              fontSize: 12,
              // @ts-expect-error recharts types are wrong
              angle: -45,
              textAnchor: "end",
              dy: 5,
              fill: "currentColor",
              opacity: 0.65,
            }}
            tickFormatter={tickFormatter}
            stroke="currentColor"
            opacity={0.2}
          />
          <YAxis
            width={45}
            tick={{
              fontSize: 12,
              fill: "currentColor",
              opacity: 0.65,
            }}
            tickFormatter={(value) => formatValue(value)}
            domain={domain}
            stroke="currentColor"
            opacity={0.2}
          />
          <Tooltip
            content={
              <CustomTooltip
                formatter={tooltipFormatter}
                labelFormatter={tooltipLabelFormatter}
              />
            }
          />
          <Line
            type="step"
            accentHeight={20}
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 8 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
