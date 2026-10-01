export const POOP_STATUSES = ['normal', 'quick', 'a struggle', "don't ask"] as const;

export type PoopStatus = (typeof POOP_STATUSES)[number];

/** UI-facing record. Timestamps are always UTC ISO 8601 strings. */
export interface PoopRecord {
  id: string;
  timestamp: string;
  status?: PoopStatus;
  note?: string;
}

export type CreatePoopInput = Omit<PoopRecord, 'id'>;
export type UpdatePoopInput = Partial<CreatePoopInput>;

export interface PoopRepository {
  getLatest(): Promise<PoopRecord | null>;
  list(): Promise<PoopRecord[]>;
  getById(id: string): Promise<PoopRecord | null>;
  create(input: CreatePoopInput): Promise<PoopRecord>;
  update(id: string, input: UpdatePoopInput): Promise<PoopRecord>;
  delete(id: string): Promise<void>;
}
