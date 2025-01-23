import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartDataPoint } from "../lib/types";
import {
  Formatter,
  Payload,
} from "recharts/types/component/DefaultTooltipContent";

interface BarGraphProps {
  data: ChartDataPoint[];
  color: string;
  label: string;
  formatValue?: (value: number) => string;
  tickFormatter: (date: string) => string;
  tooltipFormatter?: Formatter<number, string>;
  tooltipLabelFormatter: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    label: any,
    payload: Payload<number, string>[],
  ) => React.ReactNode;
}

export function BarGraph({
  data,
  color,
  label,
  formatValue = (v: number) => v.toString(),
  tickFormatter,
  tooltipFormatter = (value: number) => [formatValue(value), label],
  tooltipLabelFormatter,
}: BarGraphProps) {
  return (
    <div className="relative h-[320px] w-full">
      <div className="absolute left-0 top-0 text-sm text-gray-500 dark:text-gray-400">
        {label}
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 40,
            right: 16,
            left: 0,
            bottom: 24,
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
            tickFormatter={formatValue}
            stroke="currentColor"
            opacity={0.2}
          />
          <Tooltip
            formatter={tooltipFormatter}
            labelFormatter={tooltipLabelFormatter}
            contentStyle={{
              backgroundColor: "var(--background)",
              border: "1px solid var(--border)",
              borderRadius: "0.5rem",
              color: "var(--foreground)",
            }}
          />
          <Bar
            dataKey="value"
            fill={color}
            isAnimationActive={false}
            activeBar={{
              fill: color,
              fillOpacity: 1,
              stroke: "currentColor",
              strokeOpacity: 0.1,
              strokeWidth: 1,
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
