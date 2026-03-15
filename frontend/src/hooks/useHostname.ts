import { useState, useEffect } from 'react';

export function useHostname() {
  const [hostname, setHostname] = useState<string>('Home Lab');

  useEffect(() => {
    fetch('/api/info')
      .then(r => r.json())
      .then(d => { if (d.hostname) setHostname(d.hostname); })
      .catch(() => {});
  }, []);

  return hostname;
}
