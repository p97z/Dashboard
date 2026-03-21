import { useState, useEffect } from 'react';
import type { MachineInfo } from '../types';

export function useMachines() {
  const [machines, setMachines] = useState<MachineInfo[]>([]);

  useEffect(() => {
    fetch('/api/machines')
      .then(r => r.json())
      .then((data: MachineInfo[]) => setMachines(data))
      .catch(() => setMachines([{ id: 'local', label: 'Local' }]));
  }, []);

  return machines;
}
