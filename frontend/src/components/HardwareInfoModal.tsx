import { useEffect } from 'react';
import { X, Cpu, HardDrive, Monitor, Network, Server, Loader2, AlertTriangle } from 'lucide-react';
import type { HardwareInfo } from '../types';
import { useHardwareInfo } from '../hooks/useHardwareInfo';
import { formatBytes } from '../utils';

interface HardwareInfoModalProps {
  machineId: string;
  onClose: () => void;
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700/40 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3 text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide">
        {icon}
        <span>{title}</span>
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1 text-sm">
      <span className="text-gray-500 dark:text-gray-400 shrink-0">{label}</span>
      <span className="text-gray-800 dark:text-gray-200 text-right font-mono">{value}</span>
    </div>
  );
}

function HardwareContent({ data }: { data: HardwareInfo }) {
  const hasGpu = data.gpu.length > 0 && data.gpu.some(g => g.model);
  const hasNetwork = data.network.length > 0;
  const hasDisks = data.disks.length > 0;

  return (
    <div className="grid gap-3">
      {/* CPU */}
      <Section icon={<Cpu size={13} />} title="Processor">
        <Row label="Model" value={data.cpu.brand || data.cpu.manufacturer || 'Unknown'} />
        <Row label="Cores" value={`${data.cpu.physicalCores} physical / ${data.cpu.cores} logical`} />
        {data.cpu.speed > 0 && <Row label="Clock" value={`${data.cpu.speed} GHz`} />}
      </Section>

      {/* Memory */}
      <Section icon={<Server size={13} />} title="Memory">
        <Row label="Installed RAM" value={data.memory.total > 0 ? formatBytes(data.memory.total) : 'Unknown'} />
      </Section>

      {/* Storage */}
      {hasDisks ? (
        <Section icon={<HardDrive size={13} />} title="Storage">
          {data.disks.map((disk, i) => (
            <div key={i} className={i > 0 ? 'border-t border-gray-200 dark:border-gray-600 mt-2 pt-2' : ''}>
              <Row
                label="Device"
                value={disk.name || disk.device || 'Unknown'}
              />
              {disk.device && disk.name && disk.device !== disk.name && (
                <Row label="Path" value={disk.device} />
              )}
              {disk.size > 0 && <Row label="Capacity" value={formatBytes(disk.size)} />}
              {disk.type && <Row label="Type" value={disk.type} />}
              {disk.vendor && <Row label="Vendor" value={disk.vendor} />}
              {disk.interfaceType && <Row label="Interface" value={disk.interfaceType} />}
            </div>
          ))}
        </Section>
      ) : (
        <Section icon={<HardDrive size={13} />} title="Storage">
          <p className="text-sm text-gray-400 dark:text-gray-500">Not available</p>
        </Section>
      )}

      {/* Operating System */}
      <Section icon={<Monitor size={13} />} title="Operating System">
        <Row label="OS" value={`${data.os.distro} ${data.os.release}`.trim() || 'Unknown'} />
        {data.os.arch && <Row label="Architecture" value={data.os.arch} />}
        {data.os.kernel && <Row label="Kernel" value={data.os.kernel} />}
        {data.os.hostname && <Row label="Hostname" value={data.os.hostname} />}
      </Section>

      {/* System / Motherboard */}
      {data.system && (
        <Section icon={<Server size={13} />} title="System">
          {(data.system.manufacturer || data.system.model) && (
            <Row
              label="Model"
              value={[data.system.manufacturer, data.system.model].filter(Boolean).join(' ')}
            />
          )}
          {data.system.virtual && (
            <div className="mt-1">
              <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
                Virtual Machine
              </span>
            </div>
          )}
        </Section>
      )}

      {/* GPU */}
      {hasGpu ? (
        <Section icon={<Monitor size={13} />} title="Graphics">
          {data.gpu.filter(g => g.model).map((gpu, i) => (
            <div key={i} className={i > 0 ? 'border-t border-gray-200 dark:border-gray-600 mt-2 pt-2' : ''}>
              <Row label="Model" value={[gpu.vendor, gpu.model].filter(Boolean).join(' ')} />
              {gpu.vram !== null && gpu.vram > 0 && (
                <Row label="VRAM" value={`${gpu.vram} MB`} />
              )}
            </div>
          ))}
        </Section>
      ) : null}

      {/* Baseboard */}
      {data.baseboard && (data.baseboard.manufacturer || data.baseboard.model) && (
        <Section icon={<Server size={13} />} title="Motherboard">
          <Row
            label="Model"
            value={[data.baseboard.manufacturer, data.baseboard.model].filter(Boolean).join(' ')}
          />
        </Section>
      )}

      {/* Network */}
      {hasNetwork ? (
        <Section icon={<Network size={13} />} title="Network Interfaces">
          {data.network.filter(n => n.iface && n.mac).map((n, i) => (
            <div key={i} className={i > 0 ? 'border-t border-gray-200 dark:border-gray-600 mt-2 pt-2' : ''}>
              <Row label="Interface" value={n.iface} />
              {n.mac && <Row label="MAC" value={n.mac} />}
              {n.ip4 && <Row label="IP" value={n.ip4} />}
              {n.type && <Row label="Type" value={n.type} />}
            </div>
          ))}
        </Section>
      ) : null}
    </div>
  );
}

export function HardwareInfoModal({ machineId, onClose }: HardwareInfoModalProps) {
  const { data, loading, error } = useHardwareInfo(machineId);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-lg mx-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-blue-500" />
            <span className="font-semibold text-gray-800 dark:text-white text-sm">Hardware Info</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-4 flex-1">
          {loading && (
            <div className="flex items-center justify-center py-16 gap-3 text-gray-400 dark:text-gray-500">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm">Loading hardware info…</span>
            </div>
          )}

          {error && !loading && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
              <AlertTriangle size={16} className="text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">Could not retrieve hardware info</p>
                <p className="text-xs text-red-500 dark:text-red-500 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {data && !loading && <HardwareContent data={data} />}
        </div>
      </div>
    </div>
  );
}
