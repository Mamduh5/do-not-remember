import { useCallback, useEffect, useRef, useState } from 'react';
import * as Crypto from 'expo-crypto';
import { getDatabase } from '../db/database';
import { SQLitePoopRepository } from '../repositories/SQLitePoopRepository';
import type { CreatePoopInput, PoopRecord, PoopRepository, UpdatePoopInput } from '../types/poop';

function sortRecords(records: PoopRecord[]): PoopRecord[] {
  return [...records].sort((a, b) =>
    b.timestamp.localeCompare(a.timestamp) || b.id.localeCompare(a.id)
  );
}

function messageFor(error: unknown): string {
  return error instanceof Error ? error.message : 'Could not access local records.';
}

export function usePoopStore() {
  const repository = useRef<PoopRepository | null>(null);
  const mutationInFlight = useRef(false);
  const [records, setRecords] = useState<PoopRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const initialize = useCallback(async () => {
    setIsLoading(true);
    setInitializationError(null);
    try {
      const db = await getDatabase();
      const nextRepository = new SQLitePoopRepository(db, Crypto.randomUUID);
      const initialRecords = await nextRepository.list();
      repository.current = nextRepository;
      setRecords(initialRecords);
      setError(null);
    } catch (cause) {
      setInitializationError(messageFor(cause));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const refresh = useCallback(async () => {
    if (!repository.current) return;
    try {
      setRecords(await repository.current.list());
      setError(null);
    } catch (cause) {
      setError(messageFor(cause));
      throw cause;
    }
  }, []);

  const afterMutation = useCallback(async () => {
    try {
      await refresh();
    } catch {
      // The write succeeded. Keep the already-updated local view and surface
      // the refresh error separately rather than encouraging a duplicate write.
    }
  }, [refresh]);

  const runMutation = useCallback(async <T,>(operation: (repo: PoopRepository) => Promise<T>): Promise<T> => {
    if (!repository.current) throw new Error('Local records are still loading.');
    if (mutationInFlight.current) throw new Error('Please wait for the current change.');
    mutationInFlight.current = true;
    setIsSaving(true);
    setError(null);
    try {
      return await operation(repository.current);
    } catch (cause) {
      setError(messageFor(cause));
      throw cause;
    } finally {
      mutationInFlight.current = false;
      setIsSaving(false);
    }
  }, []);

  const create = useCallback((input: CreatePoopInput) => runMutation(async repo => {
    const record = await repo.create(input);
    setRecords(previous => sortRecords([...previous, record]));
    await afterMutation();
    return record;
  }), [runMutation, afterMutation]);

  const update = useCallback((id: string, input: UpdatePoopInput) => runMutation(async repo => {
    const record = await repo.update(id, input);
    setRecords(previous => sortRecords(previous.map(item => item.id === id ? record : item)));
    await afterMutation();
    return record;
  }), [runMutation, afterMutation]);

  const remove = useCallback((id: string) => runMutation(async repo => {
    await repo.delete(id);
    setRecords(previous => previous.filter(item => item.id !== id));
    await afterMutation();
  }), [runMutation, afterMutation]);

  return {
    latest: records[0] ?? null,
    records,
    create,
    update,
    remove,
    refresh,
    retry: initialize,
    isLoading,
    initializationError,
    isSaving,
    error,
  };
}
