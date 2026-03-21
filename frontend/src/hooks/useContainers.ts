import { useState, useEffect, useCallback } from 'react';
import type { Container } from '../types';

export function useContainers(machineId?: string) {
  const [containers, setContainers] = useState<Container[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  const containerBase = (!machineId || machineId === 'local')
    ? '/api/containers'
    : `/api/machines/${machineId}/containers`;

  const fetchContainers = useCallback(async () => {
    try {
      const res = await fetch(containerBase);
      if (!res.ok) throw new Error('Failed to fetch containers');
      const data = await res.json();
      setContainers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [containerBase]);

  useEffect(() => {
    setContainers([]);
    fetchContainers();
    const interval = setInterval(fetchContainers, 5000);
    return () => clearInterval(interval);
  }, [fetchContainers]);

  const toggleContainer = async (id: string, currentState: string) => {
    setLoadingIds(prev => new Set(prev).add(id));
    try {
      const action = currentState === 'running' ? 'stop' : 'start';
      const url = (!machineId || machineId === 'local')
        ? `/api/containers/${id}/${action}`
        : `/api/machines/${machineId}/containers/${id}/${action}`;
      const res = await fetch(url, { method: 'POST' });
      if (!res.ok) throw new Error(`Failed to ${action} container`);
      await fetchContainers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return { containers, error, loadingIds, toggleContainer };
}
