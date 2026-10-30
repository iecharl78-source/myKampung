import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateAge, todayInMalaysia } from '../public/age.js';

test('Umur mengikut hari lahir, termasuk bayi dan tahun lompat', () => {
  assert.equal(calculateAge('1990-10-31', '2026-10-30'), 35);
  assert.equal(calculateAge('1990-10-30', '2026-10-30'), 36);
  assert.equal(calculateAge('1990-10-29', '2026-10-30'), 36);
  assert.equal(calculateAge('2026-10-30', '2026-10-30'), 0);
  assert.equal(calculateAge('2026-01-01', '2026-10-30'), 0);
  assert.equal(calculateAge('2000-02-29', '2025-02-28'), 24);
  assert.equal(calculateAge('2000-02-29', '2025-03-01'), 25);
  assert.equal(calculateAge('2000-02-29', '2024-02-29'), 24);
});

test('Tarikh kosong, tidak sah dan tarikh masa hadapan tidak menghasilkan umur', () => {
  for (const birth of ['', undefined, '2025-02-30', '2026-11-01', 'abc', '30/10/1990']) {
    assert.equal(calculateAge(birth, '2026-10-30'), null);
  }
});

test('Pengiraan menggunakan tarikh Malaysia walaupun UTC masih hari sebelumnya', () => {
  const today = todayInMalaysia(new Date('2026-10-29T17:00:00Z'));
  assert.equal(today, '2026-10-30');
  assert.equal(calculateAge('1990-10-30', today), 36);
});
