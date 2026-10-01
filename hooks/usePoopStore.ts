import { useState, useCallback } from 'react';
import type { PoopRecord } from '../types/poop';

// ---------------------------------------------------------------------------
// Seeded mock data — realistic sample content for UI development
// ---------------------------------------------------------------------------

const MOCK_RECORDS: PoopRecord[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 14 * 60 * 60 * 1000 - 23 * 60 * 1000).toISOString(), // ~14h 23m ago
    status: 'normal',
    note: '',
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 37 * 60 * 60 * 1000 - 12 * 60 * 1000).toISOString(),
    status: 'quick',
    note: '',
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 60 * 60 * 60 * 1000 - 5 * 60 * 1000).toISOString(),
    status: "don't ask",
    note: 'took forever',
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 84 * 60 * 60 * 1000).toISOString(),
    status: 'normal',
    note: '',
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 110 * 60 * 60 * 1000 - 45 * 60 * 1000).toISOString(),
    status: 'a struggle',
    note: 'regret everything',
  },
  {
    id: '6',
    timestamp: new Date(Date.now() - 134 * 60 * 60 * 1000).toISOString(),
    status: 'normal',
    note: '',
  },
];

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ---------------------------------------------------------------------------
// Hook — replaces a real PoopRepository implementation for UI purposes
// ---------------------------------------------------------------------------

export function usePoopStore() {
  const [records, setRecords] = useState<PoopRecord[]>(MOCK_RECORDS);

  const latest = records.length > 0
    ? records.reduce((a, b) =>
        new Date(a.timestamp) > new Date(b.timestamp) ? a : b
      )
    : null;

  const create = useCallback((partial: Omit<PoopRecord, 'id'>): PoopRecord => {
    const record: PoopRecord = { id: generateId(), ...partial };
    setRecords(prev => [record, ...prev]);
    return record;
  }, []);

  const update = useCallback((
    id: string,
    partial: Partial<Omit<PoopRecord, 'id'>>
  ): void => {
    setRecords(prev =>
      prev.map(r => (r.id === id ? { ...r, ...partial } : r))
    );
  }, []);

  const remove = useCallback((id: string): void => {
    setRecords(prev => prev.filter(r => r.id !== id));
  }, []);

  /** Sorted newest-first */
  const sorted = [...records].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return { latest, records: sorted, create, update, remove };
}
