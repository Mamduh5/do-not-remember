const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const typescript = require('typescript');

if (!require.extensions['.ts']) {
  require.extensions['.ts'] = (module, filename) => {
    const source = fs.readFileSync(filename, 'utf8');
    const output = typescript.transpileModule(source, {
      compilerOptions: { module: typescript.ModuleKind.CommonJS, target: typescript.ScriptTarget.ES2022 },
      fileName: filename,
    }).outputText;
    module._compile(output, filename);
  };
}

const {
  toLocalDateString,
  toLocalTimeString,
  getDaysInMonth,
  getFirstDayOfWeek,
  combineLocalDateTime,
  formatReadableDate,
} = require('../utils/dateTime.ts');

test('time values combine and roundtrip without timezone drift', () => {
  const times = ['00:00', '00:01', '11:59', '12:00', '12:01', '23:59'];
  const dateStr = '2026-10-29';

  for (const time of times) {
    const iso = combineLocalDateTime(dateStr, time);
    const parsed = new Date(iso);
    assert.equal(toLocalDateString(parsed), dateStr);
    assert.equal(toLocalTimeString(parsed), time);
  }
});

test('calendar handles month lengths and leap years correctly', () => {
  // February in leap year 2024
  assert.equal(getDaysInMonth(2024, 2), 29);
  // February in non-leap year 2026
  assert.equal(getDaysInMonth(2026, 2), 28);
  // Months with 30 days
  assert.equal(getDaysInMonth(2026, 4), 30);
  assert.equal(getDaysInMonth(2026, 6), 30);
  assert.equal(getDaysInMonth(2026, 9), 30);
  assert.equal(getDaysInMonth(2026, 11), 30);
  // Months with 31 days
  assert.equal(getDaysInMonth(2026, 1), 31);
  assert.equal(getDaysInMonth(2026, 10), 31);
  assert.equal(getDaysInMonth(2026, 12), 31);
});

test('first day of week calculates correctly', () => {
  // October 1, 2026 is a Thursday (4: Sun=0, Mon=1, Tue=2, Wed=3, Thu=4)
  assert.equal(getFirstDayOfWeek(2026, 10), 4);
  // November 1, 2026 is a Sunday (0)
  assert.equal(getFirstDayOfWeek(2026, 11), 0);
});

test('rejects impossible dates and invalid times', () => {
  // Non-existent February 29 in non-leap year
  assert.throws(() => combineLocalDateTime('2026-02-29', '12:00'), /Invalid calendar date/);
  // Non-existent April 31
  assert.throws(() => combineLocalDateTime('2026-04-31', '12:00'), /Invalid calendar date/);
  // Invalid hours / minutes
  assert.throws(() => combineLocalDateTime('2026-10-29', '24:00'), /Invalid time values/);
  assert.throws(() => combineLocalDateTime('2026-10-29', '12:60'), /Invalid time values/);
  assert.throws(() => combineLocalDateTime('invalid', '12:00'), /Invalid date or time format/);
});

test('formatReadableDate returns expected format', () => {
  assert.equal(formatReadableDate('2026-10-29'), 'OCT 29, 2026');
  assert.equal(formatReadableDate('2026-02-05'), 'FEB 5, 2026');
});
