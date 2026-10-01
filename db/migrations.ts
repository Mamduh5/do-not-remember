import type { SQLiteDatabase } from 'expo-sqlite';

type MigrationDatabase = Pick<SQLiteDatabase, 'getFirstAsync' | 'withTransactionAsync' | 'execAsync'>;

const MIGRATIONS = [
  `CREATE TABLE IF NOT EXISTS poop_events (
    id TEXT PRIMARY KEY NOT NULL,
    occurred_at TEXT NOT NULL,
    status TEXT NULL,
    note TEXT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_poop_events_occurred_at
    ON poop_events(occurred_at DESC);`,
];

export async function migrateDatabase(db: MigrationDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = row?.user_version;
  if (typeof currentVersion !== 'number' || !Number.isInteger(currentVersion) || currentVersion < 0) {
    throw new Error('Invalid database schema version');
  }
  if (currentVersion > MIGRATIONS.length) {
    throw new Error('Database schema is newer than this app supports');
  }

  // Initialization finishes before any repository operation is exposed.
  for (let version = currentVersion; version < MIGRATIONS.length; version++) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRATIONS[version]);
      await db.execAsync(`PRAGMA user_version = ${version + 1}`);
    });
  }
}
