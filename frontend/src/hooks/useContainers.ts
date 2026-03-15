import { useState, useEffect, useCallback } from 'react';
import type { Container } from '../types';

export function useContainers() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  const fetchContainers = useCallback(async () => {
    try {
      const res = await fetch('/api/containers');
      if (!res.ok) throw new Error('Failed to fetch containers');
      const data = await res.json();
      setContainers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  useEffect(() => {
    fetchContainers();
    const interval = setInterval(fetchContainers, 5000);
    return () => clearInterval(interval);
  }, [fetchContainers]);

  const toggleContainer = async (id: string, currentState: string) => {
    setLoadingIds(prev => new Set(prev).add(id));
    try {
      const action = currentState === 'running' ? 'stop' : 'start';
      const res = await fetch(`/api/containers/${id}/${action}`, { method: 'POST' });
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
