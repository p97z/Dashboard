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
  Legend,
} from 'recharts';
import type { HistoryPoint, MetricKey } from '../types';
import { getMetricDomain, getMetricStroke, formatMetricValue, getMetricLabel } from '../utils';

interface MetricGraphProps {
  history: HistoryPoint[];
  metricKey: MetricKey;
  chartType?: 'area' | 'pie';
  pieSlices?: Array<{ key: MetricKey; value: number | null }>;
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

function MetricPieChart({ slices }: { slices: Array<{ key: MetricKey; value: number | null }> }) {
  const data = slices
    .filter(s => s.value !== null && s.value > 0)
    .map(s => ({
      name: getMetricLabel(s.key),
      value: Math.round((s.value ?? 0) * 10) / 10,
      fill: getMetricStroke(s.key),
    }));

  if (data.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-gray-400 dark:text-gray-600 text-xs">
        No data
      </div>
    );
  }

  return (
    <div className="h-32 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius="35%"
            outerRadius="65%"
            strokeWidth={0}
            isAnimationActive={false}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => [`${v}`, '']} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MetricGraph({ history, metricKey, chartType, pieSlices }: MetricGraphProps) {
  if (chartType === 'pie' && pieSlices) {
    return <MetricPieChart slices={pieSlices} />;
  }

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
