const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

// Транспилируем чистую TS-логику без отдельного тестового фреймворка.
const source = readFileSync(path.join(__dirname, '../src/models/matches.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});
const model = { exports: {} };
new Function('exports', 'module', compiled.outputText)(model.exports, model);
const { filterMatches, formatStart, formatStatus } = model.exports;
const { matches } = require('../data/matches.json');

test('Все сохраняет все 8 матчей, включая live и postponed', () => {
  assert.deepEqual(filterMatches(matches, 'all').map((match) => match.id), matches.map((match) => match.id));
});

test('Предстоящие включает перенесённый матч без даты и scheduled с прошедшей датой', () => {
  assert.deepEqual(filterMatches(matches, 'upcoming').map((match) => match.id), ['m5', 'm6', 'm7', 'm8']);
});

test('Завершённые включает матч со счётом 0:0, исключает live', () => {
  assert.deepEqual(filterMatches(matches, 'finished').map((match) => match.id), ['m1', 'm2', 'm3']);
});

test('Пустые данные и неизвестный статус', () => {
  for (const filter of ['all', 'upcoming', 'finished']) assert.deepEqual(filterMatches([], filter), []);
  const unknown = { ...matches[0], status: 'unknown' };
  assert.equal(filterMatches([unknown], 'all').length, 1);
  assert.equal(filterMatches([unknown], 'upcoming').length, 0);
  assert.equal(filterMatches([unknown], 'finished').length, 0);
  assert.equal(formatStatus(unknown), 'Статус уточняется');
});

test('Нет даты, неверная дата и нулевая минута live', () => {
  assert.equal(formatStart(null), 'Дата уточняется');
  assert.equal(formatStart('invalid'), 'Дата уточняется');
  assert.equal(formatStatus({ ...matches[3], minute: 0 }), 'Идёт матч · 0 мин');
});

test('Время форматируется в часовом поясе устройства', () => {
  const original = process.env.TZ;
  try {
    process.env.TZ = 'UTC';
    const utc = formatStart(matches[0].startsAt);
    assert.match(utc, /13:00/);
    process.env.TZ = 'Europe/Moscow';
    assert.match(formatStart(matches[0].startsAt), /16:00/);
  } finally {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  }
});
