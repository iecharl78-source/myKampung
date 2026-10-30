import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeEducation, employmentStatuses, educationLevels, studyLevels } from '../public/education.js';

test('Rekod lama tanpa status masih boleh dibaca dan disimpan', () => {
  assert.deepEqual(normalizeEducation({}), {employmentStatus:'',educationLevel:'',studyLevel:''});
});

test('Pelajar mesti mempunyai tahap pendidikan dan pelajar universiti mesti mempunyai tahap pengajian', () => {
  assert.throws(()=>normalizeEducation({employmentStatus:'Pelajar'}),/tahap pendidikan/);
  assert.throws(()=>normalizeEducation({employmentStatus:'Pelajar',educationLevel:'Universiti'}),/tahap pengajian/);
  for (const educationLevel of educationLevels.filter(level=>level!=='Universiti')) {
    assert.deepEqual(normalizeEducation({employmentStatus:'Pelajar',educationLevel}), {employmentStatus:'Pelajar',educationLevel,studyLevel:''});
  }
  for (const studyLevel of studyLevels) {
    assert.deepEqual(normalizeEducation({employmentStatus:'Pelajar',educationLevel:'Universiti',studyLevel}), {employmentStatus:'Pelajar',educationLevel:'Universiti',studyLevel});
  }
});

test('Pertukaran status membuang butiran pendidikan yang tidak lagi berkenaan', () => {
  for (const employmentStatus of employmentStatuses.filter(status=>status!=='Pelajar')) {
    assert.deepEqual(normalizeEducation({employmentStatus,educationLevel:'Universiti',studyLevel:'Sarjana'}),{employmentStatus,educationLevel:'',studyLevel:''});
  }
  assert.deepEqual(normalizeEducation({employmentStatus:'Pelajar',educationLevel:'Sekolah rendah',studyLevel:'Sarjana'}),{employmentStatus:'Pelajar',educationLevel:'Sekolah rendah',studyLevel:''});
});

test('Pilihan luar senarai dan jenis data tidak sah ditolak', () => {
  for (const employmentStatus of ['Tidak sah', {}, 1]) assert.throws(()=>normalizeEducation({employmentStatus}),/status pekerjaan/);
  assert.throws(()=>normalizeEducation({employmentStatus:'Pelajar',educationLevel:'Tidak sah'}),/tahap pendidikan/);
  assert.throws(()=>normalizeEducation({employmentStatus:'Pelajar',educationLevel:'Universiti',studyLevel:'Tidak sah'}),/tahap pengajian/);
});
