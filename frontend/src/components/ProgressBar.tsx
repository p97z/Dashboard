
import { getProgressColor } from '../utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
}

export function ProgressBar({ value, max = 100, className = '' }: ProgressBarProps) {
  const percent = Math.min((value / max) * 100, 100);
  return (
    <div className={`w-full bg-gray-700 rounded-full h-2 ${className}`}>
      <div
        className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(percent)}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
