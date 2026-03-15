import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { CardConfig, MetricKey } from '../types';
import type { MetricOption } from '../utils';

interface CardConfigModalProps {
  card: CardConfig;
  availableMetrics: MetricOption[];
  onSave: (updated: CardConfig) => void;
  onClose: () => void;
}

export function CardConfigModal({ card, availableMetrics, onSave, onClose }: CardConfigModalProps) {
  const [title, setTitle] = useState(card.title);
  const [selected, setSelected] = useState<Set<MetricKey>>(new Set(card.metrics));
  const [showGraph, setShowGraph] = useState(card.showGraph);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  function toggle(key: MetricKey) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function handleSave() {
    // Preserve original ordering, append newly added ones at the end
    const ordered = card.metrics.filter(k => selected.has(k));
    for (const key of selected) {
      if (!ordered.includes(key)) ordered.push(key);
    }
    onSave({ ...card, title, metrics: ordered, showGraph });
  }

  // Group available metrics by their group label
  const groups: Record<string, MetricOption[]> = {};
  for (const opt of availableMetrics) {
    (groups[opt.group] ??= []).push(opt);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-gray-800 border border-gray-600 rounded-xl shadow-2xl w-full max-w-sm mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <h2 className="text-sm font-semibold text-white">Configure Card</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400 font-medium uppercase tracking-wide">Card Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Metrics */}
          <div className="flex flex-col gap-3">
            <label className="text-xs text-gray-400 font-medium uppercase tracking-wide">Metrics</label>
            {Object.entries(groups).map(([group, opts]) => (
              <div key={group} className="flex flex-col gap-1.5">
                <div className="text-xs text-gray-500 font-medium">{group}</div>
                {opts.map(opt => (
                  <label
                    key={opt.key}
                    className="flex items-center gap-3 cursor-pointer select-none rounded-lg px-3 py-2 hover:bg-gray-700/60 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(opt.key)}
                      onChange={() => toggle(opt.key)}
                      className="w-4 h-4 accent-blue-500 rounded"
                    />
                    <span className="text-sm text-gray-200">{opt.label}</span>
                  </label>
                ))}
              </div>
            ))}
          </div>

          {/* Show graph toggle */}
          <label className="flex items-center justify-between cursor-pointer select-none rounded-lg px-3 py-2.5 bg-gray-700/40 border border-gray-700">
            <span className="text-sm text-gray-200">Show graphs</span>
            <button
              role="switch"
              aria-checked={showGraph}
              onClick={() => setShowGraph(v => !v)}
              className={`relative w-10 h-5 rounded-full transition-colors ${showGraph ? 'bg-blue-500' : 'bg-gray-600'}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${showGraph ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </label>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
