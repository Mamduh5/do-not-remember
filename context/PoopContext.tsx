import React, { createContext, useContext } from 'react';
import { usePoopStore } from '../hooks/usePoopStore';
import type { PoopRecord } from '../types/poop';

// ---------------------------------------------------------------------------
// Context — wires the mock store into the component tree.
// When the backend agent ships a real PoopRepository,
// swap usePoopStore for a hook that calls it.
// ---------------------------------------------------------------------------

interface PoopContextValue {
  latest: PoopRecord | null;
  records: PoopRecord[];
  create: (partial: Omit<PoopRecord, 'id'>) => PoopRecord;
  update: (id: string, partial: Partial<Omit<PoopRecord, 'id'>>) => void;
  remove: (id: string) => void;
}

const PoopContext = createContext<PoopContextValue | null>(null);

export function PoopProvider({ children }: { children: React.ReactNode }) {
  const store = usePoopStore();
  return <PoopContext.Provider value={store}>{children}</PoopContext.Provider>;
}

export function usePoopContext(): PoopContextValue {
  const ctx = useContext(PoopContext);
  if (!ctx) throw new Error('usePoopContext must be used inside <PoopProvider>');
  return ctx;
}
