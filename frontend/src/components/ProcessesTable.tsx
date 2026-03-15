import { useState } from 'react';
import { Cpu, ChevronDown } from 'lucide-react';
import type { Metrics } from '../types';
import { formatBytes } from '../utils';

interface ProcessesTableProps {
  processes: Metrics['topProcesses'];
}

export function ProcessesTable({ processes }: ProcessesTableProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (processes.length === 0) return null;

  const maxCpu = Math.max(...processes.map(p => p.cpu), 1);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        onClick={() => setCollapsed(v => !v)}
        className="w-full flex items-center gap-2 px-5 py-4 border-b border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wide hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
      >
        <ChevronDown size={14} className={`shrink-0 transition-transform duration-200 ${collapsed ? '-rotate-90' : ''}`} />
        <Cpu size={16} />
        <span>Top Processes</span>
        <span className="ml-auto text-gray-400 dark:text-gray-600 text-xs normal-case font-normal">by CPU</span>
      </button>

      {!collapsed && (
        <>
          {/* Mobile layout */}
          <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700/50">
            {processes.map(proc => {
              const cpuWidth = (proc.cpu / maxCpu) * 100;
              const cpuColor = proc.cpu >= 50 ? 'bg-red-500' : proc.cpu >= 20 ? 'bg-yellow-500' : 'bg-blue-500';
              return (
                <div key={proc.pid} className="px-4 py-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-medium text-sm text-gray-800 dark:text-gray-200">{proc.name}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">{proc.pid}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${cpuColor}`} style={{ width: `${cpuWidth}%` }} />
                    </div>
                    <span className="text-xs tabular-nums text-gray-600 dark:text-gray-300 w-12 text-right">{proc.cpu.toFixed(1)}%</span>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>Mem {proc.memPercent.toFixed(1)}%</span>
                    <span>RSS {formatBytes(proc.memRss * 1024)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-gray-400 dark:text-gray-500 text-xs uppercase border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left px-5 py-3">Process</th>
                  <th className="text-left px-5 py-3">PID</th>
                  <th className="text-left px-5 py-3 w-40">CPU</th>
                  <th className="text-left px-5 py-3">Memory</th>
                  <th className="text-left px-5 py-3">RSS</th>
                </tr>
              </thead>
              <tbody>
                {processes.map(proc => {
                  const cpuWidth = (proc.cpu / maxCpu) * 100;
                  const cpuColor = proc.cpu >= 50 ? 'bg-red-500' : proc.cpu >= 20 ? 'bg-yellow-500' : 'bg-blue-500';
                  return (
                    <tr key={proc.pid} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-5 py-2.5 text-sm font-mono font-medium text-gray-700 dark:text-gray-200">{proc.name}</td>
                      <td className="px-5 py-2.5 text-sm font-mono text-gray-400 dark:text-gray-500">{proc.pid}</td>
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full transition-all duration-500 ${cpuColor}`} style={{ width: `${cpuWidth}%` }} />
                          </div>
                          <span className="text-xs tabular-nums text-gray-600 dark:text-gray-300 w-12 text-right">{proc.cpu.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-2.5 text-sm tabular-nums text-purple-500 dark:text-purple-400">{proc.memPercent.toFixed(1)}%</td>
                      <td className="px-5 py-2.5 text-sm tabular-nums text-gray-500 dark:text-gray-400">{formatBytes(proc.memRss * 1024)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
