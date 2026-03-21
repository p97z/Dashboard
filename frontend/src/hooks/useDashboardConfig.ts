import { useState, useEffect } from 'react';
import type { Metrics, DashboardLayout, CardConfig } from '../types';

const STORAGE_KEY_PREFIX = 'dashboard-layout-v2';

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
      chartType: 'area',
    },
    {
      id: newId(),
      title: 'Performance',
      metrics: ['load_1', 'load_5', 'load_15', 'net_connections'],
      showGraph: false,
      chartType: 'area',
    },
  ];

  if (metrics.disks.length > 0) {
    const diskMetrics = [
      ...metrics.disks.map(d => `disk:${d.mount}`),
      ...(metrics.diskIO ? ['disk_io_read', 'disk_io_write'] : []),
    ];
    cards.push({ id: newId(), title: 'Storage', metrics: diskMetrics, showGraph: false, chartType: 'area' });
  }

  if (metrics.network.length > 0) {
    const netMetrics = metrics.network.flatMap(n => [`net_rx:${n.iface}`, `net_tx:${n.iface}`]);
    cards.push({ id: newId(), title: 'Network', metrics: netMetrics, showGraph: false, chartType: 'area' });
  }

  const gpuMetrics = metrics.gpu
    .flatMap(g => [
      ...(g.utilizationGpu !== null ? [`gpu_util:${g.index}`] : []),
      ...(g.temperatureGpu !== null ? [`gpu_temp:${g.index}`] : []),
    ]);
  if (gpuMetrics.length > 0) {
    cards.push({ id: newId(), title: 'GPU', metrics: gpuMetrics, showGraph: false, chartType: 'area' });
  }

  if (metrics.fans.length > 0) {
    cards.push({ id: newId(), title: 'Cooling', metrics: metrics.fans.map(f => `fan:${f.index}`), showGraph: false, chartType: 'area' });
  }

  return { cards };
}

function normalizeCard(card: CardConfig): CardConfig {
  return { ...card, chartType: card.chartType ?? 'area' };
}

export function useDashboardConfig(metrics: Metrics | null, machineId: string = 'local') {
  const storageKey = `${STORAGE_KEY_PREFIX}-${machineId}`;

  const [layout, setLayoutState] = useState<DashboardLayout | null>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as DashboardLayout;
        return { cards: parsed.cards.map(normalizeCard) };
      }
    } catch { /* ignore */ }
    return null;
  });

  // Reload layout from localStorage when machine changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as DashboardLayout;
        setLayoutState({ cards: parsed.cards.map(normalizeCard) });
      } else {
        setLayoutState(null);
      }
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

  function addCard() {
    setLayoutState(prev => {
      if (!prev) return prev;
      const card: CardConfig = { id: newId(), title: 'New Card', metrics: [], showGraph: false, chartType: 'area' };
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

  function reorderCards(newOrder: CardConfig[]) {
    setLayoutState({ cards: newOrder });
  }

  return {
    layout: layout ?? { cards: [] },
    addCard,
    removeCard,
    updateCard,
    reorderCards,
  };
}
