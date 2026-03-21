export interface Metrics {
  cpu: {
    usage: number;
    temperature: number | null;
    loadAvg: [number, number, number];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usedPercent: number;
    swapTotal: number;
    swapUsed: number;
    swapPercent: number;
  };
  uptime: number;
  disks: Array<{
    fs: string;
    mount: string;
    size: number;
    used: number;
    available: number;
    usedPercent: number;
  }>;
  diskIO: { readBytesPerSec: number; writeBytesPerSec: number } | null;
  network: Array<{
    iface: string;
    rxSec: number;
    txSec: number;
    rxBytes: number;
    txBytes: number;
  }>;
  connections: number;
  gpu: Array<{
    index: number;
    model: string;
    utilizationGpu: number | null;
    temperatureGpu: number | null;
    memUsed: number | null;
    memTotal: number | null;
  }>;
  fans: Array<{
    index: number;
    label: string;
    rpm: number;
  }>;
  topProcesses: Array<{
    pid: number;
    name: string;
    cpu: number;
    memPercent: number;
    memRss: number;
  }>;
}

export interface Container {
  id: string;
  names: string[];
  image: string;
  state: string;
  status: string;
  restartCount: number;
  cpuPercent: number | null;
  memUsed: number | null;
  memPercent: number | null;
}

// Metric key naming convention:
//   'cpu_usage'          CPU usage %
//   'cpu_temp'           CPU temperature °C
//   'load_1/5/15'        Load averages
//   'memory'             Memory usage %
//   'swap'               Swap usage %
//   'uptime'             System uptime (seconds)
//   'disk:{mount}'       Disk usage % for mount
//   'disk_io_read'       Aggregate disk read bytes/sec
//   'disk_io_write'      Aggregate disk write bytes/sec
//   'net_rx:{iface}'     Network RX bytes/sec
//   'net_tx:{iface}'     Network TX bytes/sec
//   'net_connections'    Established TCP connections
//   'gpu_util:{index}'   GPU utilisation %
//   'gpu_temp:{index}'   GPU temperature °C
//   'fan:{index}'        Fan speed RPM
export type MetricKey = string;

export interface CardConfig {
  id: string;
  title: string;
  metrics: MetricKey[];
  showGraph: boolean;
  chartType: 'area' | 'donut';
}

export interface MachineInfo {
  id: string;
  label: string;
  description?: string;
}

export interface DashboardLayout {
  cards: CardConfig[];
}

export interface HistoryPoint {
  t: number;
  values: Record<string, number | null>;
}
