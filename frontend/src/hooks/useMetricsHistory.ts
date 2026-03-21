import { useState, useEffect, useRef } from 'react';
import type { Metrics, HistoryPoint } from '../types';
import { getMetricValue, getAvailableMetrics } from '../utils';

const MAX_HISTORY = 60; // 60 × 3 s = 3 minutes

export function useMetricsHistory(machineId?: string) {
  const endpoint = (!machineId || machineId === 'local')
    ? '/api/metrics'
    : `/api/machines/${machineId}/metrics`;

  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const metricsRef = useRef<Metrics | null>(null);

  useEffect(() => {
    setMetrics(null);
    setHistory([]);
    setError(null);
    metricsRef.current = null;

    const fetchMetrics = async () => {
      try {
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error('Failed to fetch metrics');
        const data: Metrics = await res.json();
        metricsRef.current = data;
        setMetrics(data);
        setError(null);

        const keys = getAvailableMetrics(data).map(o => o.key);
        const values: Record<string, number | null> = {};
        for (const key of keys) {
          values[key] = getMetricValue(key, data);
        }

        setHistory(prev => {
          const point: HistoryPoint = { t: Date.now(), values };
          const next = [...prev, point];
          return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    fetchMetrics();
    const id = setInterval(fetchMetrics, 3000);
    return () => clearInterval(id);
  }, [endpoint]);

  return { metrics, history, error };
}
