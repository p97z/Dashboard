import { useState, useEffect, useRef } from 'react';
import { X, RefreshCw, Power, ChevronDown, ChevronUp, Lock } from 'lucide-react';

interface UpdatesModalProps {
  machineId: string;
  machineLabel: string;
  onClose: () => void;
}

interface PackageUpdate {
  name: string;
  version: string;
}

export function UpdatesModal({ machineId, machineLabel, onClose }: UpdatesModalProps) {
  const isLocal = !machineId || machineId === 'local';
  const updatesUrl  = isLocal ? '/api/system/updates'  : `/api/machines/${machineId}/system/updates`;
  const upgradeUrl  = isLocal ? '/api/system/upgrade'  : `/api/machines/${machineId}/system/upgrade`;
  const rebootUrl   = isLocal ? '/api/system/reboot'   : `/api/machines/${machineId}/system/reboot`;

  const [packages, setPackages] = useState<PackageUpdate[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [showPackages, setShowPackages] = useState(false);
  const [password, setPassword] = useState('');
  const [upgrading, setUpgrading] = useState(false);
  const [rebooting, setRebooting] = useState(false);
  const [output, setOutput] = useState('');
  const [done, setDone] = useState(false);
  const outputRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    fetch(updatesUrl)
      .then(r => r.json())
      .then(d => { setPackages(d.packages ?? []); setLoadingPackages(false); })
      .catch(() => setLoadingPackages(false));
  }, [updatesUrl]);

  // Auto-scroll output to bottom
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  async function runUpgrade() {
    if (!password) return;
    setUpgrading(true);
    setOutput('');
    setDone(false);
    try {
      const response = await fetch(upgradeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!response.body) throw new Error('No response stream');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        setOutput(prev => prev + decoder.decode(value, { stream: true }));
      }
    } catch (err) {
      setOutput(prev => prev + `\n[Error: ${err instanceof Error ? err.message : 'Unknown'}]\n`);
    } finally {
      setUpgrading(false);
      setDone(true);
    }
  }

  async function runReboot() {
    if (!password) return;
    setRebooting(true);
    try {
      await fetch(rebootUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      setOutput(prev => prev + '\n[Reboot command sent — machine will restart shortly]\n');
    } catch {
      setOutput(prev => prev + '\n[Reboot command sent]\n');
    } finally {
      setRebooting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-2xl w-full max-w-lg mx-4 flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h2 className="text-sm font-semibold text-gray-800 dark:text-white">System Updates</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{machineLabel}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-4 overflow-y-auto">

          {/* Package count */}
          <div className="flex items-center justify-between">
            {loadingPackages ? (
              <span className="text-sm text-gray-500 dark:text-gray-400">Checking for updates…</span>
            ) : (
              <span className="text-sm text-gray-700 dark:text-gray-200">
                <span className={`font-semibold ${packages.length > 0 ? 'text-amber-500' : 'text-green-500'}`}>
                  {packages.length}
                </span>
                {' '}package{packages.length !== 1 ? 's' : ''} available
              </span>
            )}
            {packages.length > 0 && (
              <button
                onClick={() => setShowPackages(v => !v)}
                className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-400"
              >
                {showPackages ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {showPackages ? 'Hide' : 'Show'} list
              </button>
            )}
          </div>

          {/* Package list */}
          {showPackages && packages.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 max-h-40 overflow-y-auto">
              {packages.map((p, i) => (
                <div key={i} className="flex items-baseline justify-between text-xs py-0.5">
                  <span className="text-gray-700 dark:text-gray-300 font-mono">{p.name}</span>
                  <span className="text-gray-400 dark:text-gray-500 font-mono ml-2">{p.version}</span>
                </div>
              ))}
            </div>
          )}

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide flex items-center gap-1.5">
              <Lock size={11} />
              Sudo Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !upgrading) runUpgrade(); }}
              placeholder="Required to run updates"
              className="bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Live output */}
          {output && (
            <pre
              ref={outputRef}
              className="bg-gray-950 text-green-400 text-xs font-mono rounded-lg p-3 max-h-64 overflow-y-auto whitespace-pre-wrap leading-relaxed"
            >
              {output}
            </pre>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-5 py-4 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Close
          </button>

          <button
            onClick={runUpgrade}
            disabled={!password || upgrading || rebooting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors"
          >
            <RefreshCw size={14} className={upgrading ? 'animate-spin' : ''} />
            {upgrading ? 'Updating…' : done ? 'Run Again' : 'Run Updates'}
          </button>

          <button
            onClick={runReboot}
            disabled={!password || upgrading || rebooting}
            title="Reboot machine"
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Power size={14} className={rebooting ? 'animate-pulse' : ''} />
            {rebooting ? 'Rebooting…' : 'Reboot'}
          </button>
        </div>
      </div>
    </div>
  );
}
