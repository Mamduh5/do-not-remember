import React, { createContext, useContext } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { usePoopStore } from '../hooks/usePoopStore';
import { C } from '../constants/colors';
import { PixelText } from '../components/Typography';
import { PrimaryButton } from '../components/Controls';
import type { CreatePoopInput, PoopRecord, UpdatePoopInput } from '../types/poop';

interface PoopContextValue {
  latest: PoopRecord | null;
  records: PoopRecord[];
  create: (input: CreatePoopInput) => Promise<PoopRecord>;
  update: (id: string, input: UpdatePoopInput) => Promise<PoopRecord>;
  remove: (id: string) => Promise<void>;
  isSaving: boolean;
  error: string | null;
}

const PoopContext = createContext<PoopContextValue | null>(null);

export function PoopProvider({ children }: { children: React.ReactNode }) {
  const store = usePoopStore();
  if (store.isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={C.ink} />
      </View>
    );
  }
  if (store.initializationError) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 24 }}>
        <PixelText size="xs" color={C.ink} align="center">COULD NOT OPEN RECORDS</PixelText>
        <PixelText size="xxs" color={C.muted} align="center">{store.initializationError}</PixelText>
        <PrimaryButton label="RETRY" onPress={() => { void store.retry(); }} />
      </View>
    );
  }
  return <PoopContext.Provider value={store}>{children}</PoopContext.Provider>;
}

export function usePoopContext(): PoopContextValue {
  const ctx = useContext(PoopContext);
  if (!ctx) throw new Error('usePoopContext must be used inside <PoopProvider>');
  return ctx;
}
