import type { SQLiteDatabase } from 'expo-sqlite';
import { POOP_STATUSES } from '../types/poop';
import type { CreatePoopInput, PoopRecord, PoopRepository, PoopStatus, UpdatePoopInput } from '../types/poop';

type Database = Pick<SQLiteDatabase, 'getFirstAsync' | 'getAllAsync' | 'runAsync'>;

interface PoopRow {
  id: unknown;
  occurred_at: unknown;
  status: unknown;
  note: unknown;
  created_at: unknown;
  updated_at: unknown;
}

const COLUMNS = 'id, occurred_at, status, note, created_at, updated_at';

export class PoopNotFoundError extends Error {
  constructor() {
    super('Record no longer exists');
    this.name = 'PoopNotFoundError';
  }
}

export class InvalidPoopRecordError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPoopRecordError';
  }
}

function normalizeTimestamp(value: string): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    throw new InvalidPoopRecordError('Invalid timestamp');
  }
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    throw new InvalidPoopRecordError('Invalid timestamp');
  }
  const normalized = date.toISOString();
  if (normalized !== value) {
    throw new InvalidPoopRecordError('Timestamp must be an unambiguous ISO UTC value');
  }
  return normalized;
}

function normalizeStatus(status: PoopStatus | undefined): PoopStatus | null {
  if (status === undefined) return null;
  if (!POOP_STATUSES.includes(status)) {
    throw new InvalidPoopRecordError('Invalid status');
  }
  return status;
}

function normalizeNote(note: string | undefined): string | null {
  if (note === undefined) return null;
  if (typeof note !== 'string' || note.length > 80) {
    throw new InvalidPoopRecordError('Note must be at most 80 characters');
  }
  return note.trim() || null;
}

function mapRow(row: PoopRow): PoopRecord {
  if (typeof row.id !== 'string' || !row.id || typeof row.occurred_at !== 'string') {
    throw new InvalidPoopRecordError('Database contains a malformed record');
  }
  const timestamp = normalizeTimestamp(row.occurred_at);
  const status = POOP_STATUSES.find(value => value === row.status);
  const note = typeof row.note === 'string' && row.note.length <= 80 ? row.note : undefined;
  return { id: row.id, timestamp, ...(status ? { status } : {}), ...(note ? { note } : {}) };
}

export class SQLitePoopRepository implements PoopRepository {
  constructor(private readonly db: Database, private readonly generateId: () => string) {}

  async getLatest(): Promise<PoopRecord | null> {
    const row = await this.db.getFirstAsync<PoopRow>(
      `SELECT ${COLUMNS} FROM poop_events ORDER BY occurred_at DESC, id DESC LIMIT 1`
    );
    return row ? mapRow(row) : null;
  }

  async list(): Promise<PoopRecord[]> {
    const rows = await this.db.getAllAsync<PoopRow>(
      `SELECT ${COLUMNS} FROM poop_events ORDER BY occurred_at DESC, id DESC`
    );
    return rows.map(mapRow);
  }

  async getById(id: string): Promise<PoopRecord | null> {
    const row = await this.db.getFirstAsync<PoopRow>(
      `SELECT ${COLUMNS} FROM poop_events WHERE id = ?`, id
    );
    return row ? mapRow(row) : null;
  }

  async create(input: CreatePoopInput): Promise<PoopRecord> {
    const timestamp = normalizeTimestamp(input.timestamp);
    const status = normalizeStatus(input.status);
    const note = normalizeNote(input.note);
    const id = this.generateId();
    const now = new Date().toISOString();
    await this.db.runAsync(
      'INSERT INTO poop_events (id, occurred_at, status, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      id, timestamp, status, note, now, now
    );
    return { id, timestamp, ...(status ? { status } : {}), ...(note ? { note } : {}) };
  }

  async update(id: string, input: UpdatePoopInput): Promise<PoopRecord> {
    const existing = await this.getById(id);
    if (!existing) throw new PoopNotFoundError();
    const timestamp = input.timestamp === undefined ? existing.timestamp : normalizeTimestamp(input.timestamp);
    const status = 'status' in input ? normalizeStatus(input.status) : existing.status ?? null;
    const note = 'note' in input ? normalizeNote(input.note) : existing.note ?? null;
    const result = await this.db.runAsync(
      'UPDATE poop_events SET occurred_at = ?, status = ?, note = ?, updated_at = ? WHERE id = ?',
      timestamp, status, note, new Date().toISOString(), id
    );
    if (result.changes === 0) throw new PoopNotFoundError();
    return { id, timestamp, ...(status ? { status } : {}), ...(note ? { note } : {}) };
  }

  async delete(id: string): Promise<void> {
    const result = await this.db.runAsync('DELETE FROM poop_events WHERE id = ?', id);
    if (result.changes === 0) throw new PoopNotFoundError();
  }
}
