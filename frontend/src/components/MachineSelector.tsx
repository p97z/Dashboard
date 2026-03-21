import { Server } from 'lucide-react';
import type { MachineInfo } from '../types';

interface MachineSelectorProps {
  machines: MachineInfo[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function MachineSelector({ machines, selectedId, onSelect }: MachineSelectorProps) {
  if (machines.length <= 1) return null;

  return (
    <>
      {/* Desktop tab strip */}
      <div className="hidden md:flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {machines.map(m => (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            title={m.description}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              m.id === selectedId
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <Server size={12} />
            {m.label}
          </button>
        ))}
      </div>

      {/* Mobile select */}
      <select
        value={selectedId}
        onChange={e => onSelect(e.target.value)}
        className="md:hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-sm text-gray-700 dark:text-gray-200"
      >
        {machines.map(m => (
          <option key={m.id} value={m.id}>{m.label}</option>
        ))}
      </select>
    </>
  );
}
