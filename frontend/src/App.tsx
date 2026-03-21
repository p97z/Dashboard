import { useState, useEffect } from 'react';
import { Activity, AlertCircle, LayoutGrid, CheckCheck, Plus, Sun, Moon, Bell, ArrowUpCircle } from 'lucide-react';
import { useMetricsHistory } from './hooks/useMetricsHistory';
import { useContainers } from './hooks/useContainers';
import { useDashboardConfig } from './hooks/useDashboardConfig';
import { useTheme } from './hooks/useTheme';
import { useAlerts } from './hooks/useAlerts';
import { useHostname } from './hooks/useHostname';
import { useMachines } from './hooks/useMachines';
import { getAvailableMetrics, getMetricValue } from './utils';
import { ConfigurableCard } from './components/ConfigurableCard';
import { ContainersTable } from './components/ContainersTable';
import { ProcessesTable } from './components/ProcessesTable';
import { MachineSelector } from './components/MachineSelector';
import { UpdatesModal } from './components/UpdatesModal';

function App() {
  const machines = useMachines();
  const [selectedMachineId, setSelectedMachineId] = useState<string>(() =>
    localStorage.getItem('selected-machine') ?? 'local'
  );

  // Persist selected machine
  useEffect(() => {
    localStorage.setItem('selected-machine', selectedMachineId);
  }, [selectedMachineId]);

  // Reset to local if the selected machine is no longer in the list
  useEffect(() => {
    if (machines.length > 0 && !machines.find(m => m.id === selectedMachineId)) {
      setSelectedMachineId('local');
    }
  }, [machines, selectedMachineId]);

  const { metrics, history, error: metricsError } = useMetricsHistory(selectedMachineId);
  const { containers, error: containersError, loadingIds, toggleContainer } = useContainers(selectedMachineId);
  const { layout, addCard, removeCard, updateCard } = useDashboardConfig(metrics, selectedMachineId);
  const { theme, toggleTheme } = useTheme();
  const { thresholds, setThreshold, checkAlerts, isAboveThreshold, permission, requestPermission } = useAlerts();
  const hostname = useHostname(selectedMachineId);

  const [editMode, setEditMode] = useState(false);
  const [updatesOpen, setUpdatesOpen] = useState(false);

  const error = metricsError || containersError;
  const availableMetrics = metrics ? getAvailableMetrics(metrics) : [];

  // Check alerts whenever metrics update
  useEffect(() => {
    if (!metrics) return;
    const values: Record<string, number | null> = {};
    for (const opt of getAvailableMetrics(metrics)) {
      values[opt.key] = getMetricValue(opt.key, metrics);
    }
    checkAlerts(values);
  }, [metrics, checkAlerts]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <header className="border-b border-gray-200 dark:border-gray-800 px-6 py-4 sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Activity size={22} className="text-blue-500 dark:text-blue-400 shrink-0" />
          <h1 className="text-lg font-semibold">{hostname}</h1>

          <MachineSelector
            machines={machines}
            selectedId={selectedMachineId}
            onSelect={id => { setSelectedMachineId(id); setEditMode(false); }}
          />

          <div className="ml-auto flex items-center gap-2">
            {error ? (
              <span className="flex items-center gap-1.5 text-red-500 dark:text-red-400 text-sm">
                <AlertCircle size={14} />
                {error}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400 text-sm">
                <span className="w-2 h-2 rounded-full bg-green-500 dark:bg-green-400 animate-pulse" />
                Live
              </span>
            )}

            {/* Notification permission */}
            {permission !== 'granted' && Object.keys(thresholds).length > 0 && (
              <button
                onClick={requestPermission}
                title="Enable alert notifications"
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-amber-500/40 text-amber-500 dark:text-amber-400 hover:bg-amber-500/10 transition-colors"
              >
                <Bell size={13} />
                Enable alerts
              </button>
            )}

            {/* Updates */}
            <button
              onClick={() => setUpdatesOpen(true)}
              title="System updates"
              className="flex items-center gap-1.5 text-sm px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowUpCircle size={15} />
              <span className="hidden sm:inline">Updates</span>
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Edit layout */}
            <button
              onClick={() => setEditMode(v => !v)}
              className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                editMode
                  ? 'bg-blue-600 border-blue-500 text-white hover:bg-blue-500'
                  : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {editMode ? <CheckCheck size={14} /> : <LayoutGrid size={14} />}
              {editMode ? 'Done' : 'Edit Layout'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-6">
        {!metrics && !metricsError && (
          <div className="flex items-center justify-center h-40 text-gray-400 dark:text-gray-500">
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
                thresholds={thresholds}
                onSetThreshold={setThreshold}
                isAboveThreshold={isAboveThreshold}
                onUpdate={updateCard}
                onRemove={() => removeCard(card.id)}
              />
            ))}
            {editMode && (
              <button
                onClick={addCard}
                className="flex flex-col items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800/50 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl py-8 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
              >
                <Plus size={20} />
                <span className="text-sm">Add Card</span>
              </button>
            )}
          </div>
        )}

        <ContainersTable containers={containers} loadingIds={loadingIds} onToggle={toggleContainer} />
        {metrics && <ProcessesTable processes={metrics.topProcesses} />}
      </main>

      {updatesOpen && (
        <UpdatesModal
          machineId={selectedMachineId}
          machineLabel={machines.find(m => m.id === selectedMachineId)?.label ?? selectedMachineId}
          onClose={() => setUpdatesOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
