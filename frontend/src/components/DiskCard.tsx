
import { HardDrive } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { ProgressBar } from './ProgressBar';
import { formatBytes, getUsageColor } from '../utils';
import type { Metrics } from '../types';

interface DiskCardProps {
  disks: Metrics['disks'];
}

export function DiskCard({ disks }: DiskCardProps) {
  return (
    <MetricCard title="Disk" icon={<HardDrive size={16} />}>
      <div className="flex flex-col gap-3">
        {disks.map(disk => (
          <div key={disk.mount} className="flex flex-col gap-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300 font-mono">{disk.mount}</span>
              <span className={getUsageColor(disk.usedPercent)}>{disk.usedPercent}%</span>
            </div>
            <ProgressBar value={disk.usedPercent} />
            <div className="text-gray-500 text-xs">
              {formatBytes(disk.used)} / {formatBytes(disk.size)}
            </div>
          </div>
        ))}
      </div>
    </MetricCard>
  );
}
