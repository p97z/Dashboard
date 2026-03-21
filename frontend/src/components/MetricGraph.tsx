import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import type { HistoryPoint, MetricKey } from '../types';
import {
  getMetricDomain,
  getMetricStroke,
  getMetricValueColor,
  formatMetricValue,
  getMetricLabel,
} from '../utils';

interface MetricGraphProps {
  history: HistoryPoint[];
  metricKey: MetricKey;
}

interface ChartPoint {
  t: number;
  v: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-xs text-gray-700 dark:text-gray-200 shadow">
      {payload[0].value}
    </div>
  );
}

/** Single donut gauge for one metric — shows current value as a filled arc. */
export function MetricDonutGauge({ metricKey, value }: { metricKey: MetricKey; value: number | null }) {
  const stroke = getMetricStroke(metricKey);
  const label = getMetricLabel(metricKey);
  const formatted = formatMetricValue(metricKey, value);

  const [, domainMax] = getMetricDomain(metricKey);
  const max = typeof domainMax === 'number' ? domainMax : null;
  // If we have a fixed max (0-100 range), fill proportionally. Otherwise fill fully.
  const fillPercent = (max !== null && value !== null) ? Math.min((value / max) * 100, 100) : 100;

  const data = [
    { value: fillPercent },
    { value: 100 - fillPercent },
  ];

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-20 h-20">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="80%"
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              strokeWidth={0}
              isAnimationActive={false}
            >
              <Cell fill={stroke} />
              <Cell fill="rgba(107,114,128,0.2)" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xs font-semibold leading-none text-center px-1 ${getMetricValueColor(metricKey, value)}`}>
            {formatted}
          </span>
        </div>
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400 text-center leading-tight max-w-[80px]">
        {label}
      </span>
    </div>
  );
}

export function MetricGraph({ history, metricKey }: MetricGraphProps) {
  const stroke = getMetricStroke(metricKey);
  const [domainMin, domainMax] = getMetricDomain(metricKey);

  const data = useMemo<ChartPoint[]>(() =>
    history.map(p => ({
      t: p.t,
      v: p.values[metricKey] ?? 0,
    })),
    [history, metricKey]
  );

  const gradientId = `grad-${metricKey.replace(/[^a-zA-Z0-9]/g, '_')}`;

  if (data.length < 2) {
    return (
      <div className="h-16 flex items-center justify-center text-gray-400 dark:text-gray-600 text-xs">
        Collecting data…
      </div>
    );
  }

  return (
    <div className="h-16 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={stroke} stopOpacity={0.3} />
              <stop offset="95%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis domain={[domainMin, domainMax]} hide />
          <Tooltip
            content={<CustomTooltip />}
            formatter={(v: number) => [formatMetricValue(metricKey, v), '']}
          />
          <Area
            type="monotone"
            dataKey="v"
            stroke={stroke}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
