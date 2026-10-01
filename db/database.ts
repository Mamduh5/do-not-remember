import * as SQLite from 'expo-sqlite';
import { migrateDatabase } from './migrations';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = (async () => {
      const db = await SQLite.openDatabaseAsync('poop.db');
      await db.execAsync('PRAGMA journal_mode = WAL');
      await migrateDatabase(db);
      return db;
    })().catch(error => {
      databasePromise = null;
      throw error;
    });
  }
  return databasePromise;
}
