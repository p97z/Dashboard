import { useState, useEffect } from 'react';
import type { HardwareInfo } from '../types';

export function useHardwareInfo(machineId: string | null) {
  const [data, setData] = useState<HardwareInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!machineId) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    setData(null);
    setLoading(true);
    setError(null);

    fetch(`/api/machines/${machineId}/hardware-info`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: HardwareInfo) => {
        setData(d);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to retrieve hardware info');
        setLoading(false);
      });
  }, [machineId]);

  return { data, loading, error };
}
