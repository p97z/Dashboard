import { Cpu } from 'lucide-react';
import type { Metrics } from '../types';
import { formatBytes } from '../utils';

interface ProcessesTableProps {
  processes: Metrics['topProcesses'];
}

export function ProcessesTable({ processes }: ProcessesTableProps) {
  if (processes.length === 0) return null;

  const maxCpu = Math.max(...processes.map(p => p.cpu), 1);

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-700 text-gray-400 text-sm font-medium uppercase tracking-wide">
        <Cpu size={16} />
        <span>Top Processes</span>
        <span className="ml-auto text-gray-600 text-xs normal-case font-normal">by CPU</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-gray-500 text-xs uppercase border-b border-gray-700">
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
                <tr key={proc.pid} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                  <td className="px-5 py-2.5 text-sm font-mono font-medium text-gray-200">{proc.name}</td>
                  <td className="px-5 py-2.5 text-sm font-mono text-gray-500">{proc.pid}</td>
                  <td className="px-5 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-500 ${cpuColor}`}
                          style={{ width: `${cpuWidth}%` }}
                        />
                      </div>
                      <span className="text-xs tabular-nums text-gray-300 w-12 text-right">
                        {proc.cpu.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-2.5 text-sm tabular-nums text-purple-400">
                    {proc.memPercent.toFixed(1)}%
                  </td>
                  <td className="px-5 py-2.5 text-sm tabular-nums text-gray-400">
                    {formatBytes(proc.memRss * 1024)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
