
import { MemoryStick } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { ProgressBar } from './ProgressBar';
import { formatBytes, getUsageColor } from '../utils';
import type { Metrics } from '../types';

interface MemoryCardProps {
  memory: Metrics['memory'];
}

export function MemoryCard({ memory }: MemoryCardProps) {
  return (
    <MetricCard title="Memory" icon={<MemoryStick size={16} />}>
      <div className={`text-4xl font-bold ${getUsageColor(memory.usedPercent)}`}>
        {memory.usedPercent}%
      </div>
      <ProgressBar value={memory.usedPercent} />
      <div className="text-gray-400 text-sm">
        {formatBytes(memory.used)} / {formatBytes(memory.total)}
      </div>
    </MetricCard>
  );
}
