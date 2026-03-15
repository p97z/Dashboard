import type { MetricKey } from '../types';
import {
  getMetricLabel, formatMetricValue, getMetricValueColor,
  getProgressColor, isPercentMetric,
} from '../utils';

interface MetricRowProps {
  metricKey: MetricKey;
  value: number | null;
  alert?: boolean;
}

export function MetricRow({ metricKey, value, alert = false }: MetricRowProps) {
  const label = getMetricLabel(metricKey);
  const formatted = formatMetricValue(metricKey, value);
  const valueColor = alert ? 'text-red-500 dark:text-red-400' : getMetricValueColor(metricKey, value);
  const showBar = isPercentMetric(metricKey) && value !== null;
  const percent = showBar ? Math.min(value!, 100) : 0;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-gray-500 dark:text-gray-400 text-xs">{label}</span>
        <div className="flex items-center gap-1.5">
          {alert && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />}
          <span className={`text-sm font-semibold tabular-nums ${valueColor}`}>{formatted}</span>
        </div>
      </div>
      {showBar && (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all duration-500 ${alert ? 'bg-red-500' : getProgressColor(percent)}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </div>
  );
}
