import { useState } from 'react';
import { Activity, AlertCircle, LayoutGrid, CheckCheck, Plus } from 'lucide-react';
import { useMetricsHistory } from './hooks/useMetricsHistory';
import { useContainers } from './hooks/useContainers';
import { useDashboardConfig } from './hooks/useDashboardConfig';
import { getAvailableMetrics } from './utils';
import { ConfigurableCard } from './components/ConfigurableCard';
import { ContainersTable } from './components/ContainersTable';
import { ProcessesTable } from './components/ProcessesTable';

function App() {
  const { metrics, history, error: metricsError } = useMetricsHistory();
  const { containers, error: containersError, loadingIds, toggleContainer } = useContainers();
  const { layout, addCard, removeCard, updateCard } = useDashboardConfig(metrics);

  const [editMode, setEditMode] = useState(false);

  const error = metricsError || containersError;
  const availableMetrics = metrics ? getAvailableMetrics(metrics) : [];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 sticky top-0 z-40 bg-gray-900/95 backdrop-blur">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Activity size={22} className="text-blue-400 shrink-0" />
          <h1 className="text-lg font-semibold">Home Lab</h1>

          <div className="ml-auto flex items-center gap-3">
            {error ? (
              <span className="flex items-center gap-1.5 text-red-400 text-sm">
                <AlertCircle size={14} />
                {error}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-green-400 text-sm">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Live
              </span>
            )}

            <button
              onClick={() => setEditMode(v => !v)}
              className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                editMode
                  ? 'bg-blue-600 border-blue-500 text-white hover:bg-blue-500'
                  : 'border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
              }`}
            >
              {editMode ? <CheckCheck size={14} /> : <LayoutGrid size={14} />}
              {editMode ? 'Done' : 'Edit Layout'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-6">
        {/* Metrics cards */}
        {!metrics && !metricsError && (
          <div className="flex items-center justify-center h-40 text-gray-500">
            Loading metrics…
          </div>
        )}

        {(metrics || layout.cards.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {layout.cards.map(card => (
              <ConfigurableCard
                key={card.id}
                card={card}
                metrics={metrics}
                history={history}
                availableMetrics={availableMetrics}
                editMode={editMode}
                onUpdate={updateCard}
                onRemove={() => removeCard(card.id)}
              />
            ))}

            {/* Add card button — only in edit mode */}
            {editMode && (
              <button
                onClick={addCard}
                className="flex flex-col items-center justify-center gap-2 bg-gray-800/50 border border-dashed border-gray-600 rounded-xl py-8 text-gray-500 hover:text-gray-300 hover:border-gray-500 transition-colors"
              >
                <Plus size={20} />
                <span className="text-sm">Add Card</span>
              </button>
            )}
          </div>
        )}

        {/* Containers */}
        <ContainersTable
          containers={containers}
          loadingIds={loadingIds}
          onToggle={toggleContainer}
        />

        {/* Top Processes */}
        {metrics && <ProcessesTable processes={metrics.topProcesses} />}
      </main>
    </div>
  );
}

export default App;
