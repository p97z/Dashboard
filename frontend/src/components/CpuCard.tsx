
import { Cpu } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { ProgressBar } from './ProgressBar';
import { getUsageColor } from '../utils';

interface CpuCardProps {
  usage: number;
}

export function CpuCard({ usage }: CpuCardProps) {
  return (
    <MetricCard title="CPU Usage" icon={<Cpu size={16} />}>
      <div className={`text-4xl font-bold ${getUsageColor(usage)}`}>
        {usage}%
      </div>
      <ProgressBar value={usage} />
    </MetricCard>
  );
}
