import { useState } from 'react';
import { Play, Square, Loader2, Container, AlertTriangle, ChevronDown, FileText } from 'lucide-react';
import type { Container as ContainerType } from '../types';
import { formatBytes } from '../utils';
import { LogsModal } from './LogsModal';

interface ContainersTableProps {
  containers: ContainerType[];
  loadingIds: Set<string>;
  onToggle: (id: string, state: string) => void;
}

export function ContainersTable({ containers, loadingIds, onToggle }: ContainersTableProps) {
  const running = containers.filter(c => c.state === 'running').length;
  const [collapsed, setCollapsed] = useState(false);
  const [logsTarget, setLogsTarget] = useState<{ id: string; name: string } | null>(null);

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <button
          onClick={() => setCollapsed(v => !v)}
          className="w-full flex items-center gap-2 px-5 py-4 border-b border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wide hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <ChevronDown size={14} className={`shrink-0 transition-transform duration-200 ${collapsed ? '-rotate-90' : ''}`} />
          <Container size={16} />
          <span>Docker Containers</span>
          <span className="ml-auto bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full px-2 py-0.5 normal-case font-normal">
            {running} / {containers.length} running
          </span>
        </button>

        {!collapsed && (
          <>
            {/* Mobile card layout */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700/50">
              {containers.length === 0 ? (
                <p className="text-center text-gray-400 dark:text-gray-500 py-8 text-sm">No containers found</p>
              ) : containers.map(c => {
                const isRunning = c.state === 'running';
                const isLoading = loadingIds.has(c.id);
                const name = c.names[0] || c.id.slice(0, 12);
                return (
                  <div key={c.id} className="px-4 py-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-medium text-sm text-gray-800 dark:text-white truncate">{name}</span>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${isRunning ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/20' : 'bg-gray-100 dark:bg-gray-600/30 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600/30'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-green-500 dark:bg-green-400' : 'bg-gray-400'}`} />
                        {c.state}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 font-mono truncate">{c.image}</div>
                    {isRunning && (c.cpuPercent !== null || c.memUsed !== null) && (
                      <div className="flex gap-4 text-xs">
                        {c.cpuPercent !== null && <span className="text-blue-500 dark:text-blue-400">CPU {c.cpuPercent.toFixed(1)}%</span>}
                        {c.memUsed !== null && <span className="text-purple-500 dark:text-purple-400">Mem {formatBytes(c.memUsed)}</span>}
                        {c.restartCount > 0 && <span className="text-amber-500 dark:text-amber-400">↺ {c.restartCount}</span>}
                      </div>
                    )}
                    <div className="flex gap-2">
                      {isRunning && (
                        <button
                          onClick={() => setLogsTarget({ id: c.id, name })}
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700/40 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                          <FileText size={11} /> Logs
                        </button>
                      )}
                      <button
                        onClick={() => !isLoading && onToggle(c.id, c.state)}
                        disabled={isLoading}
                        className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition-colors disabled:opacity-50 ${isRunning ? 'bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 border-red-200 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20' : 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/20 hover:bg-green-100 dark:hover:bg-green-500/20'}`}
                      >
                        {isLoading ? <Loader2 size={11} className="animate-spin" /> : isRunning ? <Square size={11} /> : <Play size={11} />}
                        {isLoading ? 'Working…' : isRunning ? 'Stop' : 'Start'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table layout */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-gray-400 dark:text-gray-500 text-xs uppercase border-b border-gray-100 dark:border-gray-700">
                    <th className="text-left px-5 py-3">Name</th>
                    <th className="text-left px-5 py-3">Image</th>
                    <th className="text-left px-5 py-3">Status</th>
                    <th className="text-left px-5 py-3">CPU</th>
                    <th className="text-left px-5 py-3">Memory</th>
                    <th className="text-left px-5 py-3">Restarts</th>
                    <th className="text-left px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {containers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center text-gray-400 dark:text-gray-500 py-8">No containers found</td>
                    </tr>
                  ) : containers.map(container => {
                    const isRunning = container.state === 'running';
                    const isLoading = loadingIds.has(container.id);
                    const name = container.names[0] || container.id.slice(0, 12);
                    return (
                      <tr key={container.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="px-5 py-3 text-sm font-medium text-gray-800 dark:text-white font-mono">{name}</td>
                        <td className="px-5 py-3 text-sm text-gray-400 dark:text-gray-400 font-mono max-w-[200px] truncate">{container.image}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${isRunning ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/20' : 'bg-gray-100 dark:bg-gray-600/30 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600/30'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-green-500 dark:bg-green-400' : 'bg-gray-400'}`} />
                            {container.state}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-sm tabular-nums">
                          {isRunning && container.cpuPercent !== null
                            ? <span className="text-blue-500 dark:text-blue-400">{container.cpuPercent.toFixed(1)}%</span>
                            : <span className="text-gray-300 dark:text-gray-600">—</span>}
                        </td>
                        <td className="px-5 py-3 text-sm tabular-nums">
                          {isRunning && container.memUsed !== null ? (
                            <span className="text-purple-500 dark:text-purple-400">
                              {formatBytes(container.memUsed)}
                              {container.memPercent !== null && <span className="text-gray-400 dark:text-gray-500 ml-1">({container.memPercent.toFixed(1)}%)</span>}
                            </span>
                          ) : <span className="text-gray-300 dark:text-gray-600">—</span>}
                        </td>
                        <td className="px-5 py-3">
                          {container.restartCount > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-2 py-0.5 rounded-full">
                              <AlertTriangle size={10} />{container.restartCount}
                            </span>
                          ) : <span className="text-gray-300 dark:text-gray-600 text-sm">0</span>}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            {isRunning && (
                              <button
                                onClick={() => setLogsTarget({ id: container.id, name })}
                                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700/40 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600/40 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                              >
                                <FileText size={12} /> Logs
                              </button>
                            )}
                            <button
                              onClick={() => !isLoading && onToggle(container.id, container.state)}
                              disabled={isLoading}
                              className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isRunning ? 'bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 border-red-200 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20' : 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/20 hover:bg-green-100 dark:hover:bg-green-500/20'}`}
                            >
                              {isLoading ? <Loader2 size={12} className="animate-spin" /> : isRunning ? <Square size={12} /> : <Play size={12} />}
                              {isLoading ? 'Working…' : isRunning ? 'Stop' : 'Start'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {logsTarget && (
        <LogsModal
          containerId={logsTarget.id}
          containerName={logsTarget.name}
          onClose={() => setLogsTarget(null)}
        />
      )}
    </>
  );
}
