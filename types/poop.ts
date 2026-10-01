/**
 * PoopRecord — the shape of a single logged event.
 *
 * This is the UI's data contract. The backend agent will implement
 * persistence behind these same fields.
 */
export interface PoopRecord {
  id: string;
  /** ISO 8601 timestamp of when the poop happened */
  timestamp: string;
  /** Optional status tag */
  status?: 'normal' | 'quick' | 'a struggle' | "don't ask";
  /** Optional short freeform note (≤ 80 chars) */
  note?: string;
}

/**
 * The interface the UI expects from persistence.
 * Wire up a real implementation when the backend is ready.
 */
export interface PoopRepository {
  getLatest(): Promise<PoopRecord | null>;
  list(): Promise<PoopRecord[]>;
  create(partial: Omit<PoopRecord, 'id'>): Promise<PoopRecord>;
  update(id: string, partial: Partial<Omit<PoopRecord, 'id'>>): Promise<PoopRecord>;
  delete(id: string): Promise<void>;
}
