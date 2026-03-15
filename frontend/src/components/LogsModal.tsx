import { useState, useEffect, useRef } from 'react';
import { X, RefreshCw, Terminal } from 'lucide-react';

interface LogLine {
  stream: 'stdout' | 'stderr';
  text: string;
}

interface LogsModalProps {
  containerId: string;
  containerName: string;
  onClose: () => void;
}

export function LogsModal({ containerId, containerName, onClose }: LogsModalProps) {
  const [lines, setLines] = useState<LogLine[]>([]);
  const [tail, setTail] = useState(200);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  async function fetchLogs() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/containers/${containerId}/logs?tail=${tail}`);
      if (!res.ok) throw new Error('Failed to fetch logs');
      const data = await res.json();
      setLines(data.lines);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchLogs(); }, [containerId, tail]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'instant' });
  }, [lines]);

  function parseLogLine(text: string): { timestamp: string; content: string } {
    const m = text.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z)\s(.*)$/s);
    if (m) {
      const d = new Date(m[1]);
      const timestamp = `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
      return { timestamp, content: m[2] };
    }
    return { timestamp: '', content: text };
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex flex-col flex-1 m-4 rounded-xl overflow-hidden border border-gray-700 bg-gray-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-700 bg-gray-900 shrink-0">
          <Terminal size={16} className="text-green-400" />
          <span className="text-sm font-mono font-medium text-gray-200">{containerName}</span>
          <span className="text-xs text-gray-500">{lines.length} lines</span>

          <div className="ml-auto flex items-center gap-2">
            <select
              value={tail}
              onChange={e => setTail(parseInt(e.target.value))}
              className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-blue-500"
            >
              <option value={100}>Last 100</option>
              <option value={200}>Last 200</option>
              <option value={500}>Last 500</option>
              <option value={1000}>Last 1000</option>
            </select>
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Log area */}
        <div className="flex-1 overflow-y-auto bg-gray-950 p-4 font-mono text-xs leading-relaxed">
          {error && (
            <div className="text-red-400 mb-2">Error: {error}</div>
          )}
          {lines.length === 0 && !loading && !error && (
            <div className="text-gray-600">No log output.</div>
          )}
          {lines.map((line, i) => {
            const { timestamp, content } = parseLogLine(line.text);
            return (
              <div key={i} className="flex gap-3 hover:bg-gray-900/40">
                {timestamp && (
                  <span className="text-gray-600 shrink-0">{timestamp}</span>
                )}
                <span className={line.stream === 'stderr' ? 'text-red-400' : 'text-gray-300'}>
                  {content}
                </span>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
