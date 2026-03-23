import express from 'express';
import cors from 'cors';
import * as si from 'systeminformation';
import os from 'os';
import fs from 'fs';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const app = express();
app.use(cors());
app.use(express.json());

// ── Docker (optional) ─────────────────────────────────────────────────────────
// Loaded dynamically so the agent starts cleanly without Docker installed.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let docker: any = null;

try {
  if (fs.existsSync('/var/run/docker.sock')) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Docker = require('dockerode');
    docker = new Docker({ socketPath: '/var/run/docker.sock' });
    console.log('Docker: connected');
  } else {
    console.log('Docker: socket not found — container endpoints disabled');
  }
} catch {
  console.log('Docker: not available — container endpoints disabled');
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calcContainerCpu(stats: any): number {
  const cpu = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
  const system = (stats.cpu_stats.system_cpu_usage ?? 0) - (stats.precpu_stats.system_cpu_usage ?? 0);
  const cpus = stats.cpu_stats.online_cpus
    ?? stats.cpu_stats.cpu_usage.percpu_usage?.length
    ?? 1;
  return system > 0 ? (cpu / system) * cpus * 100 : 0;
}

interface LogLine {
  stream: 'stdout' | 'stderr';
  text: string;
}

function parseLogs(buffer: Buffer): LogLine[] {
  if (buffer.length >= 8) {
    const streamType = buffer[0];
    const isValid = streamType <= 2 && buffer[1] === 0 && buffer[2] === 0 && buffer[3] === 0;
    if (isValid) {
      const lines: LogLine[] = [];
      let offset = 0;
      while (offset + 8 <= buffer.length) {
        const type = buffer[offset];
        const size = buffer.readUInt32BE(offset + 4);
        offset += 8;
        if (size === 0) continue;
        if (offset + size > buffer.length) break;
        const text = buffer.subarray(offset, offset + size).toString('utf8').replace(/\r?\n$/, '');
        offset += size;
        if (text) lines.push({ stream: type === 2 ? 'stderr' : 'stdout', text });
      }
      if (lines.length > 0) return lines;
    }
  }
  return buffer.toString('utf8').split('\n').filter(Boolean).map(text => ({ stream: 'stdout', text }));
}

// ── Metrics ───────────────────────────────────────────────────────────────────

app.get('/api/metrics', async (_req, res) => {
  try {
    const [cpuLoad, cpuTemp, mem, fsSize, networkStats, time, fsStats, graphics, networkConns, processes] =
      await Promise.allSettled([
        si.currentLoad(),
        si.cpuTemperature(),
        si.mem(),
        si.fsSize(),
        si.networkStats(),
        si.time(),
        si.fsStats(),
        si.graphics(),
        si.networkConnections(),
        si.processes(),
      ]);

    const loadAvg = os.loadavg() as [number, number, number];

    const cpu    = cpuLoad.status      === 'fulfilled' ? cpuLoad.value      : null;
    const temp   = cpuTemp.status      === 'fulfilled' ? cpuTemp.value      : null;
    const memory = mem.status          === 'fulfilled' ? mem.value          : null;
    const disks  = fsSize.status       === 'fulfilled' ? fsSize.value       : [];
    const nets   = networkStats.status === 'fulfilled' ? networkStats.value : [];
    const uptime = time.status         === 'fulfilled' ? time.value.uptime  : os.uptime();
    const fs     = fsStats.status      === 'fulfilled' ? fsStats.value      : null;
    const gpu    = graphics.status     === 'fulfilled' ? graphics.value     : null;
    const conns  = networkConns.status === 'fulfilled' ? networkConns.value : [];
    const procs  = processes.status    === 'fulfilled' ? processes.value    : null;

    res.json({
      cpu: {
        usage: Math.round(cpu?.currentLoad ?? 0),
        temperature: temp?.main ?? null,
        loadAvg,
      },
      memory: {
        total: memory?.total ?? 0,
        used: memory?.active ?? 0,
        free: memory?.free ?? 0,
        usedPercent: memory ? Math.round((memory.active / memory.total) * 100) : 0,
        swapTotal: memory?.swaptotal ?? 0,
        swapUsed: memory?.swapused ?? 0,
        swapPercent: memory?.swaptotal
          ? Math.round((memory.swapused / memory.swaptotal) * 100)
          : 0,
      },
      uptime: uptime ?? os.uptime(),
      disks: disks
        .filter(d => !d.fs.startsWith('tmpfs') && !d.fs.startsWith('/dev/loop'))
        .map(d => ({
          fs: d.fs,
          mount: d.mount,
          size: d.size,
          used: d.used,
          available: d.available,
          usedPercent: Math.round(d.use ?? 0),
        })),
      diskIO: fs
        ? { readBytesPerSec: Math.round(fs.rx_sec ?? 0), writeBytesPerSec: Math.round(fs.wx_sec ?? 0) }
        : null,
      network: nets
        .filter(n => n.iface !== 'lo')
        .map(n => ({
          iface: n.iface,
          rxSec: n.rx_sec ?? 0,
          txSec: n.tx_sec ?? 0,
          rxBytes: n.rx_bytes,
          txBytes: n.tx_bytes,
        })),
      connections: conns.filter(c => c.state === 'ESTABLISHED').length,
      gpu: (gpu?.controllers ?? [])
        .filter(g => g.utilizationGpu != null || g.temperatureGpu != null)
        .map((g, i) => ({
          index: i,
          model: g.model,
          utilizationGpu: g.utilizationGpu ?? null,
          temperatureGpu: g.temperatureGpu ?? null,
          memUsed: g.memoryUsed ?? null,
          memTotal: g.memoryTotal ?? null,
        })),
      fans: [] as { index: number; label: string; rpm: number }[],
      topProcesses: (procs?.list ?? [])
        .sort((a, b) => b.cpu - a.cpu)
        .slice(0, 10)
        .map(p => ({
          pid: p.pid,
          name: p.name,
          cpu: Math.round(p.cpu * 10) / 10,
          memPercent: Math.round(p.mem * 10) / 10,
          memRss: p.memRss,
        })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// ── Containers ────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getContainerWebUrl(hostname: string, c: any): string | null {
  if (c.State !== 'running') return null;
  const labelUrl = c.Labels?.['dashboard.url'];
  if (labelUrl) return labelUrl;
  const tcpPorts = (c.Ports ?? [])
    .filter((p: any) => p.Type === 'tcp' && p.PublicPort > 0)
    .sort((a: any, b: any) => a.PublicPort - b.PublicPort);
  if (tcpPorts.length === 0) return null;
  const port = tcpPorts[0].PublicPort;
  return port === 443 ? `https://${hostname}` : `http://${hostname}:${port}`;
}

app.get('/api/containers', async (req, res) => {
  if (!docker) return res.json([]);
  try {
    const list = await docker.listContainers({ all: true });

    const enriched = await Promise.allSettled(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      list.map(async (c: any) => {
        const container = docker.getContainer(c.Id);
        const isRunning = c.State === 'running';

        const [inspectResult, statsResult] = await Promise.allSettled([
          container.inspect(),
          isRunning ? container.stats({ stream: false }) : Promise.resolve(null),
        ]);

        const restartCount =
          inspectResult.status === 'fulfilled' ? (inspectResult.value as { RestartCount: number }).RestartCount : 0;

        let cpuPercent: number | null = null;
        let memUsed: number | null = null;
        let memPercent: number | null = null;

        if (statsResult.status === 'fulfilled' && statsResult.value) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const s = statsResult.value as any;
          cpuPercent = Math.round(calcContainerCpu(s) * 10) / 10;
          const cache = (s.memory_stats.stats as Record<string, number> | undefined)?.cache ?? 0;
          memUsed = (s.memory_stats.usage ?? 0) - cache;
          const memTotal = s.memory_stats.limit ?? 0;
          memPercent = memTotal > 0 ? Math.round((memUsed / memTotal) * 1000) / 10 : 0;
        }

        return {
          id: c.Id,
          names: c.Names.map((n: string) => n.replace(/^\//, '')),
          image: c.Image,
          state: c.State,
          status: c.Status,
          restartCount,
          cpuPercent,
          memUsed,
          memPercent,
          webUrl: getContainerWebUrl(req.hostname, c),
        };
      })
    );

    res.json(
      enriched
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<unknown>).value)
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list containers' });
  }
});

app.post('/api/containers/:id/start', async (req, res) => {
  if (!docker) return res.status(503).json({ error: 'Docker not available' });
  try {
    await docker.getContainer(req.params.id).start();
    res.json({ success: true });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

app.post('/api/containers/:id/stop', async (req, res) => {
  if (!docker) return res.status(503).json({ error: 'Docker not available' });
  try {
    await docker.getContainer(req.params.id).stop();
    res.json({ success: true });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// ── Info ──────────────────────────────────────────────────────────────────────

app.get('/api/info', (_req, res) => {
  res.json({ hostname: os.hostname() });
});

// ── Hardware Info ──────────────────────────────────────────────────────────────

async function getLocalHardwareInfo(): Promise<unknown> {
  const [cpuRes, memRes, diskRes, osRes, sysRes, graphicsRes, netRes, boardRes] =
    await Promise.allSettled([
      si.cpu(),
      si.mem(),
      si.diskLayout(),
      si.osInfo(),
      si.system(),
      si.graphics(),
      si.networkInterfaces(),
      si.baseboard(),
    ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cpu = cpuRes.status === 'fulfilled' ? cpuRes.value as any : null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mem = memRes.status === 'fulfilled' ? memRes.value as any : null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const diskList = diskRes.status === 'fulfilled' ? (diskRes.value as any[]) : [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const osData = osRes.status === 'fulfilled' ? osRes.value as any : null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sysData = sysRes.status === 'fulfilled' ? sysRes.value as any : null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graphicsData = graphicsRes.status === 'fulfilled' ? graphicsRes.value as any : null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const netList = netRes.status === 'fulfilled' ? (netRes.value as any[]) : [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const boardData = boardRes.status === 'fulfilled' ? boardRes.value as any : null;

  return {
    cpu: cpu ? {
      brand: cpu.brand ?? '',
      manufacturer: cpu.manufacturer ?? '',
      speed: cpu.speed ?? 0,
      cores: cpu.cores ?? 0,
      physicalCores: cpu.physicalCores ?? 0,
    } : { brand: '', manufacturer: '', speed: 0, cores: 0, physicalCores: 0 },
    memory: { total: mem?.total ?? 0 },
    disks: diskList.map((d) => ({
      device: d.device ?? '',
      name: d.name ?? '',
      type: d.type ?? '',
      size: d.size ?? 0,
      vendor: d.vendor ?? '',
      interfaceType: d.interfaceType ?? '',
    })),
    os: osData ? {
      platform: osData.platform ?? '',
      distro: osData.distro ?? '',
      release: osData.release ?? '',
      arch: osData.arch ?? '',
      kernel: osData.kernel ?? '',
      hostname: osData.hostname ?? '',
    } : { platform: '', distro: '', release: '', arch: '', kernel: '', hostname: '' },
    system: sysData ? {
      manufacturer: sysData.manufacturer ?? '',
      model: sysData.model ?? '',
      virtual: sysData.virtual ?? false,
    } : null,
    gpu: graphicsData?.controllers
      ? graphicsData.controllers.map((c: { vendor?: string; model?: string; vram?: number | null }) => ({
          vendor: c.vendor ?? '',
          model: c.model ?? '',
          vram: c.vram ?? null,
        }))
      : [],
    network: netList
      .filter((n) => !n.internal && n.iface !== 'lo')
      .map((n) => ({
        iface: n.iface ?? '',
        mac: n.mac ?? '',
        type: n.type ?? '',
        ip4: n.ip4 ?? '',
      })),
    baseboard: boardData ? {
      manufacturer: boardData.manufacturer ?? '',
      model: boardData.model ?? '',
    } : null,
  };
}

app.get('/api/hardware-info', async (_req, res) => {
  try {
    res.json(await getLocalHardwareInfo());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve hardware info' });
  }
});

// ── Container Logs ────────────────────────────────────────────────────────────

app.get('/api/containers/:id/logs', async (req, res) => {
  if (!docker) return res.status(503).json({ error: 'Docker not available' });
  const tail = Math.min(parseInt(req.query.tail as string) || 200, 1000);
  try {
    const container = docker.getContainer(req.params.id);
    const raw = await container.logs({ stdout: true, stderr: true, tail, timestamps: true }) as unknown as Buffer;
    res.json({ lines: parseLogs(raw) });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown' });
  }
});

// ── System updates ────────────────────────────────────────────────────────────

app.get('/api/system/updates', async (_req, res) => {
  try {
    const { stdout } = await execAsync('apt list --upgradable 2>/dev/null');
    const packages = stdout.split('\n')
      .filter(l => l && !l.startsWith('Listing'))
      .map(l => ({
        name: l.split('/')[0] ?? l,
        version: l.match(/\s([\d][^\s]+)\s/)?.[1] ?? '',
      }));
    res.json({ count: packages.length, packages });
  } catch {
    res.json({ count: 0, packages: [] });
  }
});

app.post('/api/system/upgrade', (req, res) => {
  const { password } = req.body as { password?: string };
  if (!password) return res.status(400).json({ error: 'Password required' });

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 'no-cache');

  const proc = spawn(
    'sudo', ['-S', 'bash', '-c',
      'DEBIAN_FRONTEND=noninteractive apt-get update 2>&1 && DEBIAN_FRONTEND=noninteractive apt-get upgrade -y 2>&1'],
    { stdio: ['pipe', 'pipe', 'pipe'] }
  );
  proc.stdin.write(password + '\n');
  proc.stdin.end();

  proc.stdout.on('data', (d: Buffer) => res.write(d));
  proc.stderr.on('data', (d: Buffer) => res.write(d));

  const timer = setTimeout(() => { proc.kill(); res.write('\n[TIMEOUT]\n'); res.end(); }, 300000);
  proc.on('close', code => {
    clearTimeout(timer);
    res.write(`\n[${code === 0 ? 'DONE' : `FAILED (exit ${code})`}]\n`);
    res.end();
  });
});

app.post('/api/system/reboot', (req, res) => {
  const { password } = req.body as { password?: string };
  if (!password) return res.status(400).json({ error: 'Password required' });
  res.json({ success: true });
  setTimeout(() => {
    const proc = spawn('sudo', ['-S', 'reboot'], { stdio: ['pipe', 'pipe', 'pipe'] });
    proc.stdin.write(password + '\n');
    proc.stdin.end();
  }, 500);
});

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT ?? '3002', 10);
app.listen(PORT, () => console.log(`Homelab agent running on http://localhost:${PORT}`));
