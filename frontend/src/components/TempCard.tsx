
import { Thermometer } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { ProgressBar } from './ProgressBar';

interface TempCardProps {
  temperature: number | null;
}

function getTempColor(temp: number): string {
  if (temp >= 80) return 'text-red-400';
  if (temp >= 65) return 'text-yellow-400';
  return 'text-green-400';
}

function getTempPercent(temp: number): number {
  // Map 30-100°C to 0-100%
  return Math.max(0, Math.min(100, ((temp - 30) / 70) * 100));
}

export function TempCard({ temperature }: TempCardProps) {
  return (
    <MetricCard title="CPU Temp" icon={<Thermometer size={16} />}>
      {temperature !== null ? (
        <>
          <div className={`text-4xl font-bold ${getTempColor(temperature)}`}>
            {temperature}°C
          </div>
          <ProgressBar value={getTempPercent(temperature)} />
        </>
      ) : (
        <div className="text-gray-500 text-lg">N/A</div>
      )}
    </MetricCard>
  );
}
