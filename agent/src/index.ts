import express from 'express';
import cors from 'cors';
import * as si from 'systeminformation';
import os from 'os';

const app = express();
app.use(cors());
app.use(express.json());

// ── Docker (optional) ─────────────────────────────────────────────────────────
// Loaded dynamically so the agent starts cleanly without Docker installed.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let docker: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Docker = require('dockerode');
  docker = new Docker({ socketPath: '/var/run/docker.sock' });
  console.log('Docker: connected');
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
        used: memory?.used ?? 0,
        free: memory?.free ?? 0,
        usedPercent: memory ? Math.round((memory.used / memory.total) * 100) : 0,
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

app.get('/api/containers', async (_req, res) => {
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

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT ?? '3002', 10);
app.listen(PORT, () => console.log(`Homelab agent running on http://localhost:${PORT}`));
