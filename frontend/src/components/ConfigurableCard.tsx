import { useState } from 'react';
import { Settings, X, BarChart2, ChevronDown } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CardConfig, Metrics, HistoryPoint } from '../types';
import type { Thresholds } from '../hooks/useAlerts';
import { getMetricValue } from '../utils';
import { MetricRow } from './MetricRow';
import { MetricGraph, MetricDonutGauge } from './MetricGraph';
import { CardConfigModal } from './CardConfigModal';

interface ConfigurableCardProps {
  card: CardConfig;
  metrics: Metrics | null;
  history: HistoryPoint[];
  editMode: boolean;
  thresholds: Thresholds;
  onSetThreshold: (key: string, value: number | undefined) => void;
  isAboveThreshold: (key: string, value: number | null) => boolean;
  onUpdate: (updated: CardConfig) => void;
  onRemove: () => void;
}

export function ConfigurableCard({
  card, metrics, history, editMode,
  thresholds, onSetThreshold, isAboveThreshold,
  onUpdate, onRemove,
}: ConfigurableCardProps) {
  const [configOpen, setConfigOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    disabled: editMode,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isDonut = card.chartType === 'donut';

  function toggleGraph() {
    onUpdate({ ...card, showGraph: !card.showGraph });
  }

  return (
    <>
      <div ref={setNodeRef} style={style} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col">
        <div
          {...(!editMode ? { ...attributes, ...listeners } : {})}
          className={`flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-700/60 ${!editMode ? 'cursor-grab active:cursor-grabbing' : ''}`}
        >
          <button
            onClick={() => setCollapsed(v => !v)}
            onPointerDown={e => e.stopPropagation()}
            className="flex items-center gap-2 flex-1 min-w-0 text-left"
          >
            <ChevronDown
              size={14}
              className={`text-gray-400 dark:text-gray-500 shrink-0 transition-transform duration-200 ${collapsed ? '-rotate-90' : ''}`}
            />
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{card.title}</span>
          </button>

          {!isDonut && (
            <button
              onClick={toggleGraph}
              onPointerDown={e => e.stopPropagation()}
              title={card.showGraph ? 'Hide graphs' : 'Show graphs'}
              className={`p-1 rounded transition-colors ${card.showGraph ? 'text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
            >
              <BarChart2 size={14} />
            </button>
          )}

          <button
            onClick={() => setConfigOpen(true)}
            onPointerDown={e => e.stopPropagation()}
            title="Configure card"
            className="p-1 rounded text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <Settings size={14} />
          </button>

          {editMode && (
            <button
              onClick={onRemove}
              title="Remove card"
              className="p-1 rounded text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className={`px-4 py-3 flex flex-col gap-3 ${collapsed ? 'hidden' : ''}`}>
          {card.metrics.length === 0 ? (
            <p className="text-gray-400 dark:text-gray-500 text-xs text-center py-2">
              No metrics — click <Settings size={11} className="inline" /> to add some
            </p>
          ) : isDonut ? (
            <div className="grid grid-cols-3 gap-3 py-1 justify-items-center">
              {card.metrics.map(key => (
                <MetricDonutGauge
                  key={key}
                  metricKey={key}
                  value={metrics ? getMetricValue(key, metrics) : null}
                />
              ))}
            </div>
          ) : (
            card.metrics.map(key => {
              const value = metrics ? getMetricValue(key, metrics) : null;
              const alert = isAboveThreshold(key, value);
              return (
                <div key={key}>
                  <MetricRow metricKey={key} value={value} alert={alert} />
                  {card.showGraph && <MetricGraph history={history} metricKey={key} />}
                </div>
              );
            })
          )}
        </div>
      </div>

      {configOpen && (
        <CardConfigModal
          card={card}
          metrics={metrics}
          thresholds={thresholds}
          onSetThreshold={onSetThreshold}
          onSave={updated => { onUpdate(updated); setConfigOpen(false); }}
          onClose={() => setConfigOpen(false)}
        />
      )}
    </>
  );
}
