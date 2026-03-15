import { useState } from 'react';
import { Settings, X, BarChart2 } from 'lucide-react';
import type { CardConfig, Metrics, HistoryPoint } from '../types';
import type { MetricOption } from '../utils';
import { getMetricValue } from '../utils';
import { MetricRow } from './MetricRow';
import { MetricGraph } from './MetricGraph';
import { CardConfigModal } from './CardConfigModal';

interface ConfigurableCardProps {
  card: CardConfig;
  metrics: Metrics | null;
  history: HistoryPoint[];
  availableMetrics: MetricOption[];
  editMode: boolean;
  onUpdate: (updated: CardConfig) => void;
  onRemove: () => void;
}

export function ConfigurableCard({
  card,
  metrics,
  history,
  availableMetrics,
  editMode,
  onUpdate,
  onRemove,
}: ConfigurableCardProps) {
  const [configOpen, setConfigOpen] = useState(false);

  function toggleGraph() {
    onUpdate({ ...card, showGraph: !card.showGraph });
  }

  return (
    <>
      <div className="bg-gray-800 rounded-xl border border-gray-700 flex flex-col">
        {/* Card header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700/60">
          <span className="text-sm font-medium text-gray-200 flex-1 truncate">{card.title}</span>

          {/* Graph toggle — always visible */}
          <button
            onClick={toggleGraph}
            title={card.showGraph ? 'Hide graphs' : 'Show graphs'}
            className={`p-1 rounded transition-colors ${card.showGraph ? 'text-blue-400 hover:text-blue-300' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <BarChart2 size={14} />
          </button>

          {/* Settings — always visible */}
          <button
            onClick={() => setConfigOpen(true)}
            title="Configure card"
            className="p-1 rounded text-gray-500 hover:text-gray-200 transition-colors"
          >
            <Settings size={14} />
          </button>

          {/* Delete — only in edit mode */}
          {editMode && (
            <button
              onClick={onRemove}
              title="Remove card"
              className="p-1 rounded text-gray-500 hover:text-red-400 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Card body */}
        <div className="px-4 py-3 flex flex-col gap-3">
          {card.metrics.length === 0 ? (
            <p className="text-gray-500 text-xs text-center py-2">
              No metrics — click <Settings size={11} className="inline" /> to add some
            </p>
          ) : (
            card.metrics.map(key => {
              const value = metrics ? getMetricValue(key, metrics) : null;
              return (
                <div key={key}>
                  <MetricRow metricKey={key} value={value} />
                  {card.showGraph && (
                    <MetricGraph history={history} metricKey={key} />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {configOpen && (
        <CardConfigModal
          card={card}
          availableMetrics={availableMetrics}
          onSave={updated => { onUpdate(updated); setConfigOpen(false); }}
          onClose={() => setConfigOpen(false)}
        />
      )}
    </>
  );
}
