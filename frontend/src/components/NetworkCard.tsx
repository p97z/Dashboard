
import { Network } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { formatBytesPerSec } from '../utils';
import type { Metrics } from '../types';

interface NetworkCardProps {
  network: Metrics['network'];
}

export function NetworkCard({ network }: NetworkCardProps) {
  return (
    <MetricCard title="Network" icon={<Network size={16} />}>
      <div className="flex flex-col gap-2">
        {network.length === 0 ? (
          <span className="text-gray-500">No network interfaces</span>
        ) : (
          network.map(iface => (
            <div key={iface.iface} className="flex flex-col gap-1">
              <div className="text-gray-300 font-mono text-sm font-medium">{iface.iface}</div>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-blue-400">↓</span>
                  <span className="text-gray-300">{formatBytesPerSec(iface.rxSec)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-purple-400">↑</span>
                  <span className="text-gray-300">{formatBytesPerSec(iface.txSec)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </MetricCard>
  );
}
