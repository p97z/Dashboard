import { useState, useEffect } from 'react';
import type { Metrics, DashboardLayout, CardConfig } from '../types';

const STORAGE_KEY_PREFIX = 'dashboard-layout-v1';
const LEGACY_KEY = 'dashboard-layout-v1';

function newId(): string {
  return `card-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function buildDefaultLayout(metrics: Metrics): DashboardLayout {
  const cards: CardConfig[] = [
    {
      id: newId(),
      title: 'System',
      metrics: ['cpu_usage', 'cpu_temp', 'memory', 'swap', 'uptime'],
      showGraph: false,
    },
    {
      id: newId(),
      title: 'Performance',
      metrics: ['load_1', 'load_5', 'load_15', 'net_connections'],
      showGraph: false,
    },
  ];

  if (metrics.disks.length > 0) {
    const diskMetrics = [
      ...metrics.disks.map(d => `disk:${d.mount}`),
      ...(metrics.diskIO ? ['disk_io_read', 'disk_io_write'] : []),
    ];
    cards.push({ id: newId(), title: 'Storage', metrics: diskMetrics, showGraph: false });
  }

  if (metrics.network.length > 0) {
    const netMetrics = metrics.network.flatMap(n => [`net_rx:${n.iface}`, `net_tx:${n.iface}`]);
    cards.push({ id: newId(), title: 'Network', metrics: netMetrics, showGraph: false });
  }

  const gpuMetrics = metrics.gpu
    .flatMap(g => [
      ...(g.utilizationGpu !== null ? [`gpu_util:${g.index}`] : []),
      ...(g.temperatureGpu !== null ? [`gpu_temp:${g.index}`] : []),
    ]);
  if (gpuMetrics.length > 0) {
    cards.push({ id: newId(), title: 'GPU', metrics: gpuMetrics, showGraph: false });
  }

  if (metrics.fans.length > 0) {
    cards.push({ id: newId(), title: 'Cooling', metrics: metrics.fans.map(f => `fan:${f.index}`), showGraph: false });
  }

  return { cards };
}

export function useDashboardConfig(metrics: Metrics | null, machineId: string = 'local') {
  const storageKey = `${STORAGE_KEY_PREFIX}-${machineId}`;

  const [layout, setLayoutState] = useState<DashboardLayout | null>(() => {
    // One-time migration: move old unscoped key to the local-scoped key
    try {
      const legacyData = localStorage.getItem(LEGACY_KEY);
      if (legacyData && !localStorage.getItem(`${STORAGE_KEY_PREFIX}-local`)) {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}-local`, legacyData);
        localStorage.removeItem(LEGACY_KEY);
      }
    } catch { /* ignore */ }

    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? (JSON.parse(saved) as DashboardLayout) : null;
    } catch {
      return null;
    }
  });

  // Reload layout from localStorage when machine changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      setLayoutState(saved ? (JSON.parse(saved) as DashboardLayout) : null);
    } catch {
      setLayoutState(null);
    }
  }, [storageKey]);

  // First time we get metrics and have no saved layout, build defaults
  useEffect(() => {
    if (!metrics || layout !== null) return;
    setLayoutState(buildDefaultLayout(metrics));
  }, [metrics, layout]);

  // Persist every change
  useEffect(() => {
    if (layout) localStorage.setItem(storageKey, JSON.stringify(layout));
  }, [layout, storageKey]);

  function setLayout(next: DashboardLayout) {
    setLayoutState(next);
  }

  function addCard() {
    setLayoutState(prev => {
      if (!prev) return prev;
      const card: CardConfig = { id: newId(), title: 'New Card', metrics: [], showGraph: false };
      return { cards: [...prev.cards, card] };
    });
  }

  function removeCard(id: string) {
    setLayoutState(prev => {
      if (!prev) return prev;
      return { cards: prev.cards.filter(c => c.id !== id) };
    });
  }

  function updateCard(updated: CardConfig) {
    setLayoutState(prev => {
      if (!prev) return prev;
      return { cards: prev.cards.map(c => (c.id === updated.id ? updated : c)) };
    });
  }

  return {
    layout: layout ?? { cards: [] },
    setLayout,
    addCard,
    removeCard,
    updateCard,
  };
}
