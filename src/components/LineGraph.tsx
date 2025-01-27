import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Area,
  XAxisProps,
  YAxisProps,
  Tooltip,
  TooltipProps,
} from "recharts";
import { ChartDataPoint } from "../lib/types";

export function LineGraph({
  data,
  color,
  label,
  xAxisProps = {},
  yAxisProps = {},
  tooltip,
}: {
  data: ChartDataPoint[];
  color: string;
  label: string;
  xAxisProps?: Partial<XAxisProps>;
  yAxisProps?: Partial<YAxisProps>;
  tooltip?: TooltipProps<number, string>["content"];
}) {
  // Check if all data points have range values when distribution is requested
  const hasDistribution = data.every((point) => point.range !== undefined);

  return (
    <div className="relative h-[320px] w-full">
      <div className="absolute left-0 top-0 text-sm text-gray-500 dark:text-gray-400">
        {label}
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
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
            // tickFormatter={tickFormatter}
            stroke="currentColor"
            opacity={0.2}
            {...xAxisProps}
          />
          <YAxis
            width={45}
            tick={{
              fontSize: 12,
              fill: "currentColor",
              opacity: 0.65,
            }}
            // tickFormatter={(value) => formatValue(value)}
            stroke="currentColor"
            opacity={0.2}
            {...yAxisProps}
          />
          {tooltip ? <Tooltip content={tooltip} /> : null}
          {hasDistribution && (
            <Area
              type="monotone"
              dataKey="range"
              fill={color}
              fillOpacity={0.2}
              stroke="none"
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 8 }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
