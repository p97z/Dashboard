import { useState, useEffect } from 'react';
import { X, Bell } from 'lucide-react';
import type { CardConfig, Metrics, MetricKey } from '../types';
import { getMetricLabel, getAvailableMetrics } from '../utils';
import type { Thresholds } from '../hooks/useAlerts';

interface CardConfigModalProps {
  card: CardConfig;
  metrics: Metrics | null;
  thresholds: Thresholds;
  onSetThreshold: (key: MetricKey, value: number | undefined) => void;
  onSave: (updated: CardConfig) => void;
  onClose: () => void;
}

const FALLBACK_GROUPS: Record<string, { key: MetricKey; label: string }[]> = {
  System: [
    { key: 'cpu_usage', label: 'CPU Usage' },
    { key: 'cpu_temp', label: 'CPU Temp' },
    { key: 'memory', label: 'Memory' },
    { key: 'swap', label: 'Swap' },
    { key: 'uptime', label: 'Uptime' },
    { key: 'load_1', label: 'Load (1m)' },
    { key: 'load_5', label: 'Load (5m)' },
    { key: 'load_15', label: 'Load (15m)' },
    { key: 'net_connections', label: 'Connections' },
  ],
};

export function CardConfigModal({ card, metrics, thresholds, onSetThreshold, onSave, onClose }: CardConfigModalProps) {
  const [title, setTitle] = useState(card.title);
  const [selected, setSelected] = useState<Set<MetricKey>>(new Set(card.metrics));
  const [showGraph, setShowGraph] = useState(card.showGraph);
  const [chartType, setChartType] = useState<'area' | 'donut'>(card.chartType ?? 'area');
  const [localThresholds, setLocalThresholds] = useState<Record<string, string>>(() => {
    const result: Record<string, string> = {};
    for (const key of card.metrics) {
      if (thresholds[key] !== undefined) result[key] = String(thresholds[key]);
    }
    return result;
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  function toggle(key: MetricKey) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function handleThresholdChange(key: MetricKey, raw: string) {
    setLocalThresholds(prev => ({ ...prev, [key]: raw }));
    const val = parseFloat(raw);
    if (raw === '') onSetThreshold(key, undefined);
    else if (!isNaN(val)) onSetThreshold(key, val);
  }

  function handleSave() {
    const ordered = card.metrics.filter(k => selected.has(k));
    for (const key of selected) {
      if (!ordered.includes(key)) ordered.push(key);
    }
    onSave({ ...card, title, metrics: ordered, showGraph, chartType });
  }

  // Build grouped metric list from live metrics, or fall back to static list
  const groups: Record<string, { key: MetricKey; label: string }[]> = {};
  if (metrics) {
    for (const opt of getAvailableMetrics(metrics)) {
      (groups[opt.group] ??= []).push({ key: opt.key, label: opt.label });
    }
    // Also include any selected keys not in the current metrics snapshot
    for (const key of card.metrics) {
      if (!Object.values(groups).flat().some(o => o.key === key)) {
        (groups['Other'] ??= []).push({ key, label: getMetricLabel(key) });
      }
    }
  } else {
    Object.assign(groups, FALLBACK_GROUPS);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-2xl w-full max-w-sm mx-4 flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white">Configure Card</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Card Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Metrics with thresholds */}
          <div className="flex flex-col gap-3">
            <label className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Metrics</label>
            {Object.entries(groups).map(([group, opts]) => (
              <div key={group} className="flex flex-col gap-1">
                <div className="text-xs text-gray-400 dark:text-gray-500 font-medium">{group}</div>
                {opts.map(opt => (
                  <div key={opt.key} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors">
                    <label className="flex items-center gap-2 flex-1 cursor-pointer select-none min-w-0">
                      <input
                        type="checkbox"
                        checked={selected.has(opt.key)}
                        onChange={() => toggle(opt.key)}
                        className="w-4 h-4 accent-blue-500 rounded shrink-0"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-200 truncate">{opt.label}</span>
                    </label>
                    {selected.has(opt.key) && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Bell size={11} className="text-gray-400 dark:text-gray-500" />
                        <input
                          type="number"
                          placeholder="—"
                          value={localThresholds[opt.key] ?? ''}
                          onChange={e => handleThresholdChange(opt.key, e.target.value)}
                          title={`Alert threshold for ${getMetricLabel(opt.key)}`}
                          className="w-16 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 py-0.5 text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:border-blue-500 text-right"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Chart type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Chart Type</label>
            <div className="flex gap-2">
              {(['area', 'donut'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setChartType(type)}
                  className={`flex-1 py-1.5 text-sm rounded-lg border transition-colors ${
                    chartType === type
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  {type === 'area' ? 'Area Chart' : 'Donut Gauges'}
                </button>
              ))}
            </div>
          </div>

          {/* Show graph toggle — only for area chart */}
          {chartType === 'area' && (
            <label className="flex items-center justify-between cursor-pointer select-none rounded-lg px-3 py-2.5 bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-700 dark:text-gray-200">Show area graphs</span>
              <button
                role="switch"
                aria-checked={showGraph}
                onClick={() => setShowGraph(v => !v)}
                className={`relative w-10 h-5 rounded-full transition-colors ${showGraph ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${showGraph ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </label>
          )}
        </div>

        <div className="flex gap-2 px-5 py-4 border-t border-gray-100 dark:border-gray-700">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="flex-1 px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
