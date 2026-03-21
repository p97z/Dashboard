import { useState, useEffect } from 'react';

export function useHostname(machineId?: string) {
  const [hostname, setHostname] = useState<string>('Home Lab');

  const endpoint = (!machineId || machineId === 'local')
    ? '/api/info'
    : `/api/machines/${machineId}/info`;

  useEffect(() => {
    setHostname('Home Lab');
    fetch(endpoint)
      .then(r => r.json())
      .then(d => { if (d.hostname) setHostname(d.hostname); })
      .catch(() => {});
  }, [endpoint]);

  return hostname;
}
