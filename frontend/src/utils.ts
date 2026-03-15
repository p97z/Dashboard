import type { Metrics, MetricKey } from './types';

// ── Formatting ────────────────────────────────────────────────────────────────

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatBytesPerSec(bps: number): string {
  return `${formatBytes(bps)}/s`;
}

export function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function getUsageColor(percent: number): string {
  if (percent >= 80) return 'text-red-400';
  if (percent >= 60) return 'text-yellow-400';
  return 'text-green-400';
}

export function getProgressColor(percent: number): string {
  if (percent >= 80) return 'bg-red-500';
  if (percent >= 60) return 'bg-yellow-500';
  return 'bg-green-500';
}

// ── Metric key helpers ────────────────────────────────────────────────────────

export function getMetricValue(key: MetricKey, metrics: Metrics): number | null {
  switch (key) {
    case 'cpu_usage':       return metrics.cpu.usage;
    case 'cpu_temp':        return metrics.cpu.temperature;
    case 'load_1':          return metrics.cpu.loadAvg[0];
    case 'load_5':          return metrics.cpu.loadAvg[1];
    case 'load_15':         return metrics.cpu.loadAvg[2];
    case 'memory':          return metrics.memory.usedPercent;
    case 'swap':            return metrics.memory.swapPercent;
    case 'uptime':          return metrics.uptime;
    case 'disk_io_read':    return metrics.diskIO?.readBytesPerSec ?? null;
    case 'disk_io_write':   return metrics.diskIO?.writeBytesPerSec ?? null;
    case 'net_connections': return metrics.connections;
  }
  if (key.startsWith('disk:')) {
    const mount = key.slice(5);
    return metrics.disks.find(d => d.mount === mount)?.usedPercent ?? null;
  }
  if (key.startsWith('net_rx:')) {
    return metrics.network.find(n => n.iface === key.slice(7))?.rxSec ?? null;
  }
  if (key.startsWith('net_tx:')) {
    return metrics.network.find(n => n.iface === key.slice(7))?.txSec ?? null;
  }
  if (key.startsWith('gpu_util:')) {
    return metrics.gpu[parseInt(key.slice(9))]?.utilizationGpu ?? null;
  }
  if (key.startsWith('gpu_temp:')) {
    return metrics.gpu[parseInt(key.slice(9))]?.temperatureGpu ?? null;
  }
  if (key.startsWith('fan:')) {
    return metrics.fans[parseInt(key.slice(4))]?.rpm ?? null;
  }
  return null;
}

export function getMetricLabel(key: MetricKey): string {
  switch (key) {
    case 'cpu_usage':       return 'CPU Usage';
    case 'cpu_temp':        return 'CPU Temp';
    case 'load_1':          return 'Load (1m)';
    case 'load_5':          return 'Load (5m)';
    case 'load_15':         return 'Load (15m)';
    case 'memory':          return 'Memory';
    case 'swap':            return 'Swap';
    case 'uptime':          return 'Uptime';
    case 'disk_io_read':    return 'Disk Read';
    case 'disk_io_write':   return 'Disk Write';
    case 'net_connections': return 'Connections';
  }
  if (key.startsWith('disk:'))     return `Disk ${key.slice(5)}`;
  if (key.startsWith('net_rx:'))   return `${key.slice(7)} ↓`;
  if (key.startsWith('net_tx:'))   return `${key.slice(7)} ↑`;
  if (key.startsWith('gpu_util:')) return `GPU ${key.slice(9)} Usage`;
  if (key.startsWith('gpu_temp:')) return `GPU ${key.slice(9)} Temp`;
  if (key.startsWith('fan:'))      return `Fan ${key.slice(4)}`;
  return key;
}

export function formatMetricValue(key: MetricKey, value: number | null): string {
  if (value === null) return 'N/A';
  switch (key) {
    case 'cpu_usage':
    case 'memory':
    case 'swap':            return `${value}%`;
    case 'cpu_temp':        return `${value}°C`;
    case 'uptime':          return formatUptime(value);
    case 'load_1':
    case 'load_5':
    case 'load_15':         return value.toFixed(2);
    case 'disk_io_read':
    case 'disk_io_write':   return formatBytesPerSec(value);
    case 'net_connections': return `${Math.round(value)}`;
  }
  if (key.startsWith('disk:'))     return `${value}%`;
  if (key.startsWith('net_rx:') || key.startsWith('net_tx:')) return formatBytesPerSec(value);
  if (key.startsWith('gpu_util:')) return `${value}%`;
  if (key.startsWith('gpu_temp:')) return `${value}°C`;
  if (key.startsWith('fan:'))      return `${Math.round(value)} RPM`;
  return String(value);
}

/** Metrics whose value is a 0–100 percentage and should show a progress bar. */
export function isPercentMetric(key: MetricKey): boolean {
  return key === 'cpu_usage'
    || key === 'memory'
    || key === 'swap'
    || key.startsWith('disk:')
    || key.startsWith('gpu_util:');
}

/** Y-axis domain for recharts. */
export function getMetricDomain(key: MetricKey): [number, number | 'auto'] {
  if (isPercentMetric(key))        return [0, 100];
  if (key === 'cpu_temp')          return [0, 100];
  if (key.startsWith('gpu_temp:')) return [0, 100];
  return [0, 'auto'];
}

/** Stroke colour for a metric's graph line. */
export function getMetricStroke(key: MetricKey): string {
  switch (key) {
    case 'cpu_usage':       return '#60a5fa'; // blue-400
    case 'cpu_temp':        return '#fb923c'; // orange-400
    case 'load_1':
    case 'load_5':
    case 'load_15':         return '#fbbf24'; // amber-400
    case 'memory':          return '#c084fc'; // purple-400
    case 'swap':            return '#f87171'; // red-400
    case 'disk_io_read':    return '#2dd4bf'; // teal-400
    case 'disk_io_write':   return '#fb7185'; // rose-400
    case 'net_connections': return '#818cf8'; // indigo-400
  }
  if (key.startsWith('disk:'))     return '#34d399'; // emerald-400
  if (key.startsWith('net_rx:'))   return '#38bdf8'; // sky-400
  if (key.startsWith('net_tx:'))   return '#e879f9'; // fuchsia-400
  if (key.startsWith('gpu_util:')) return '#facc15'; // yellow-400
  if (key.startsWith('gpu_temp:')) return '#f97316'; // orange-500
  if (key.startsWith('fan:'))      return '#67e8f9'; // cyan-300
  return '#60a5fa';
}

/** Text colour for the displayed value. */
export function getMetricValueColor(key: MetricKey, value: number | null): string {
  if (value === null) return 'text-gray-500';
  if (isPercentMetric(key)) return getUsageColor(value);
  if (key === 'cpu_temp' || key.startsWith('gpu_temp:')) {
    if (value >= 80) return 'text-red-400';
    if (value >= 65) return 'text-yellow-400';
    return 'text-green-400';
  }
  if (key.startsWith('net_rx:') || key.startsWith('net_tx:')
    || key === 'disk_io_read' || key === 'disk_io_write') return 'text-sky-400';
  if (key === 'uptime') return 'text-blue-400';
  if (key.startsWith('load_')) return 'text-amber-400';
  return 'text-gray-300';
}

// ── Available metrics discovery ───────────────────────────────────────────────

export interface MetricOption {
  key: MetricKey;
  label: string;
  group: string;
}

export function getAvailableMetrics(metrics: Metrics): MetricOption[] {
  const opts: MetricOption[] = [
    { key: 'cpu_usage',  label: 'CPU Usage',      group: 'System' },
    { key: 'cpu_temp',   label: 'CPU Temperature', group: 'System' },
    { key: 'load_1',     label: 'Load Avg (1m)',   group: 'System' },
    { key: 'load_5',     label: 'Load Avg (5m)',   group: 'System' },
    { key: 'load_15',    label: 'Load Avg (15m)',  group: 'System' },
    { key: 'memory',     label: 'Memory',          group: 'System' },
    { key: 'swap',       label: 'Swap',            group: 'System' },
    { key: 'uptime',     label: 'Uptime',          group: 'System' },
  ];

  for (const disk of metrics.disks) {
    opts.push({ key: `disk:${disk.mount}`, label: `Disk ${disk.mount}`, group: 'Storage' });
  }
  if (metrics.diskIO) {
    opts.push({ key: 'disk_io_read',  label: 'Disk Read',  group: 'Storage' });
    opts.push({ key: 'disk_io_write', label: 'Disk Write', group: 'Storage' });
  }

  for (const net of metrics.network) {
    opts.push({ key: `net_rx:${net.iface}`, label: `${net.iface} Download`, group: 'Network' });
    opts.push({ key: `net_tx:${net.iface}`, label: `${net.iface} Upload`,   group: 'Network' });
  }
  opts.push({ key: 'net_connections', label: 'TCP Connections', group: 'Network' });

  for (const g of metrics.gpu) {
    if (g.utilizationGpu !== null)
      opts.push({ key: `gpu_util:${g.index}`, label: `${g.model} Usage`, group: 'GPU' });
    if (g.temperatureGpu !== null)
      opts.push({ key: `gpu_temp:${g.index}`, label: `${g.model} Temp`,  group: 'GPU' });
  }

  for (const f of metrics.fans) {
    opts.push({ key: `fan:${f.index}`, label: f.label, group: 'Fans' });
  }

  return opts;
}
