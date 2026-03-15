import { Play, Square, Loader2, Container, AlertTriangle } from 'lucide-react';
import type { Container as ContainerType } from '../types';
import { formatBytes } from '../utils';

interface ContainersTableProps {
  containers: ContainerType[];
  loadingIds: Set<string>;
  onToggle: (id: string, state: string) => void;
}

export function ContainersTable({ containers, loadingIds, onToggle }: ContainersTableProps) {
  const running = containers.filter(c => c.state === 'running').length;

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-700 text-gray-400 text-sm font-medium uppercase tracking-wide">
        <Container size={16} />
        <span>Docker Containers</span>
        <span className="ml-auto bg-gray-700 text-gray-300 text-xs rounded-full px-2 py-0.5">
          {running} / {containers.length} running
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-gray-500 text-xs uppercase border-b border-gray-700">
              <th className="text-left px-5 py-3">Name</th>
              <th className="text-left px-5 py-3">Image</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-left px-5 py-3">CPU</th>
              <th className="text-left px-5 py-3">Memory</th>
              <th className="text-left px-5 py-3">Restarts</th>
              <th className="text-left px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {containers.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-gray-500 py-8">
                  No containers found
                </td>
              </tr>
            ) : (
              containers.map(container => {
                const isRunning = container.state === 'running';
                const isLoading = loadingIds.has(container.id);
                const name = container.names[0] || container.id.slice(0, 12);
                const hasRestarts = container.restartCount > 0;

                return (
                  <tr key={container.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                    <td className="px-5 py-3 text-sm font-medium text-white font-mono">{name}</td>
                    <td className="px-5 py-3 text-sm text-gray-400 font-mono max-w-[200px] truncate">{container.image}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                        isRunning
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : 'bg-gray-600/30 text-gray-400 border border-gray-600/30'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-green-400' : 'bg-gray-500'}`} />
                        {container.state}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm tabular-nums">
                      {isRunning && container.cpuPercent !== null
                        ? <span className="text-blue-400">{container.cpuPercent.toFixed(1)}%</span>
                        : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-5 py-3 text-sm tabular-nums">
                      {isRunning && container.memUsed !== null ? (
                        <span className="text-purple-400">
                          {formatBytes(container.memUsed)}
                          {container.memPercent !== null && (
                            <span className="text-gray-500 ml-1">({container.memPercent.toFixed(1)}%)</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {hasRestarts ? (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                          <AlertTriangle size={10} />
                          {container.restartCount}
                        </span>
                      ) : (
                        <span className="text-gray-600 text-sm">0</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => !isLoading && onToggle(container.id, container.state)}
                        disabled={isLoading}
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          isRunning
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                            : 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20'
                        }`}
                      >
                        {isLoading ? <Loader2 size={12} className="animate-spin" /> : isRunning ? <Square size={12} /> : <Play size={12} />}
                        {isLoading ? 'Working…' : isRunning ? 'Stop' : 'Start'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
