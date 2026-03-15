import { useState, useEffect, useRef, useCallback } from 'react';
import type { MetricKey } from '../types';
import { getMetricLabel, formatMetricValue } from '../utils';

export type Thresholds = Record<string, number>;

const STORAGE_KEY = 'alert-thresholds-v1';
const COOLDOWN_MS = 5 * 60 * 1000;

export function useAlerts() {
  const [thresholds, setThresholds] = useState<Thresholds>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch { return {}; }
  });

  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );

  const lastNotified = useRef<Record<string, number>>({});
  const wasAbove = useRef<Record<string, boolean>>({});

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(thresholds));
  }, [thresholds]);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    const p = await Notification.requestPermission();
    setPermission(p);
  }, []);

  const setThreshold = useCallback((key: MetricKey, value: number | undefined) => {
    setThresholds(prev => {
      const next = { ...prev };
      if (value === undefined) delete next[key];
      else next[key] = value;
      return next;
    });
    if (value !== undefined && permission === 'default') requestPermission();
  }, [permission, requestPermission]);

  const checkAlerts = useCallback((values: Record<string, number | null>) => {
    for (const [key, threshold] of Object.entries(thresholds)) {
      const value = values[key];
      if (value === null || value === undefined) continue;
      const isNowAbove = value > threshold;
      const prev = wasAbove.current[key] ?? false;
      wasAbove.current[key] = isNowAbove;
      if (isNowAbove && !prev && permission === 'granted') {
        const now = Date.now();
        if (now - (lastNotified.current[key] ?? 0) > COOLDOWN_MS) {
          new Notification(`⚠️ ${getMetricLabel(key)}`, {
            body: `${formatMetricValue(key, value)} exceeds threshold of ${formatMetricValue(key, threshold)}`,
          });
          lastNotified.current[key] = now;
        }
      }
    }
  }, [thresholds, permission]);

  const isAboveThreshold = useCallback((key: MetricKey, value: number | null): boolean => {
    const t = thresholds[key];
    return t !== undefined && value !== null && value > t;
  }, [thresholds]);

  return { thresholds, setThreshold, checkAlerts, isAboveThreshold, permission, requestPermission };
}
