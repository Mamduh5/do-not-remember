const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const typescript = require('typescript');

// Compile the app's TypeScript with the project's installed compiler. The
// repository only imports expo-sqlite types, so these tests run real SQLite SQL.
require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const output = typescript.transpileModule(source, {
    compilerOptions: { module: typescript.ModuleKind.CommonJS, target: typescript.ScriptTarget.ES2022 },
    fileName: filename,
  }).outputText;
  module._compile(output, filename);
};

const { migrateDatabase } = require('../db/migrations.ts');
const { SQLitePoopRepository, PoopNotFoundError } = require('../repositories/SQLitePoopRepository.ts');
const { formatElapsedTime } = require('../utils/elapsedTime.ts');

function adapt(database) {
  return {
    getFirstAsync: async (sql, ...values) => database.prepare(sql).get(...values) ?? null,
    getAllAsync: async (sql, ...values) => database.prepare(sql).all(...values),
    runAsync: async (sql, ...values) => database.prepare(sql).run(...values),
    execAsync: async sql => database.exec(sql),
    withTransactionAsync: async task => {
      database.exec('BEGIN');
      try {
        await task();
        database.exec('COMMIT');
      } catch (error) {
        database.exec('ROLLBACK');
        throw error;
      }
    },
  };
}

test('migration creates an empty durable database and reopening keeps records', async () => {
  const file = path.join(os.tmpdir(), `poop-repository-${process.pid}-${Date.now()}.db`);
  try {
    let database = new DatabaseSync(file);
    let adapter = adapt(database);
    await migrateDatabase(adapter);
    await migrateDatabase(adapter);
    let repository = new SQLitePoopRepository(adapter, () => 'first');
    assert.deepEqual(await repository.list(), []);
    assert.equal(await repository.getLatest(), null);
    await repository.create({ timestamp: '2026-09-29T10:00:00.000Z' });
    database.close();

    database = new DatabaseSync(file);
    adapter = adapt(database);
    await migrateDatabase(adapter);
    repository = new SQLitePoopRepository(adapter, () => 'second');
    assert.equal((await repository.getLatest()).id, 'first');
    assert.equal((await adapter.getFirstAsync('PRAGMA user_version')).user_version, 1);
    database.close();
  } finally {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
});

test('occurrence time determines latest and history, including after edits', async () => {
  const database = new DatabaseSync(':memory:');
  try {
    const adapter = adapt(database);
    await migrateDatabase(adapter);
    let nextId = 0;
    const repository = new SQLitePoopRepository(adapter, () => `id-${++nextId}`);
    await repository.create({ timestamp: '2026-10-01T09:00:00.000Z' });
    await repository.create({ timestamp: '2026-09-29T09:00:00.000Z' });
    assert.deepEqual((await repository.list()).map(row => row.id), ['id-1', 'id-2']);
    assert.equal((await repository.getLatest()).id, 'id-1');

    await repository.update('id-2', { timestamp: '2026-10-02T09:00:00.000Z' });
    assert.deepEqual((await repository.list()).map(row => row.id), ['id-2', 'id-1']);
    assert.equal((await repository.getLatest()).id, 'id-2');
    await repository.delete('id-2');
    assert.equal(await repository.getById('id-2'), null);
    assert.equal((await repository.getLatest()).id, 'id-1');
    await assert.rejects(repository.delete('id-2'), PoopNotFoundError);
  } finally {
    database.close();
  }
});

test('optional fields persist, clear, validate, and tolerate malformed optional data', async () => {
  const database = new DatabaseSync(':memory:');
  try {
    const adapter = adapt(database);
    await migrateDatabase(adapter);
    const repository = new SQLitePoopRepository(adapter, () => 'one');
    await repository.create({ timestamp: '2026-10-01T09:00:00.000Z', status: 'quick', note: '  short note  ' });
    assert.equal((await repository.getById('one')).note, 'short note');
    await repository.update('one', { timestamp: '2026-09-30T09:00:00.000Z' });
    assert.equal((await repository.getById('one')).status, 'quick');
    await repository.update('one', { status: undefined, note: undefined });
    assert.deepEqual(await repository.getById('one'), { id: 'one', timestamp: '2026-09-30T09:00:00.000Z' });
    await assert.rejects(repository.update('missing', { note: 'x' }), PoopNotFoundError);
    await assert.rejects(repository.update('one', { note: 'x'.repeat(81) }), /80 characters/);
    await assert.rejects(repository.update('one', { timestamp: '2026-02-31T09:00:00.000Z' }), /ISO UTC/);
    database.prepare('UPDATE poop_events SET status = ?, note = ? WHERE id = ?').run('unknown', 'x'.repeat(81), 'one');
    assert.deepEqual(await repository.getById('one'), { id: 'one', timestamp: '2026-09-30T09:00:00.000Z' });
  } finally {
    database.close();
  }
});

test('elapsed time handles minutes, hours, days, and a midnight boundary', () => {
  const now = Date.parse('2026-10-01T00:10:00.000Z');
  assert.equal(formatElapsedTime('2026-10-01T00:09:00.000Z', now).primary, '1m');
  assert.equal(formatElapsedTime('2026-09-30T22:00:00.000Z', now).primary, '2h 10m');
  assert.equal(formatElapsedTime('2026-09-28T23:00:00.000Z', now).primary, '2d 1h');
  assert.equal(formatElapsedTime(null, now).secondary, 'never');
  assert.equal(formatElapsedTime('2026-10-01T00:11:00.000Z', now).primary, 'just now');
});
