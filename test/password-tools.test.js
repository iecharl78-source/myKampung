import { test } from 'node:test';
import assert from 'node:assert/strict';
import { passwordStrength, suggestPassword } from '../public/password-tools.js';

test('Penunjuk kekuatan membezakan empat tahap dan corak kata laluan mudah',()=>{
  assert.equal(passwordStrength('').level,0);
  for(const password of ['short','Password123456!','aaaaaaaaaaaa!A2','abcabcabcabcA!9','12345678901234567890']) assert.equal(passwordStrength(password).label,'Weak');
  assert.equal(passwordStrength('Bunga!73Pagi').label,'Medium');
  assert.equal(passwordStrength('Bunga!73Pagi#92xx').label,'Strong');
  assert.equal(passwordStrength('Bunga!73Pagi#92Langit').label,'Strongest');
});

test('Cadangan ialah 20 aksara dengan semua jenis aksara dan tahap Strongest',()=>{
  const generated=new Set();
  for(let i=0;i<20;i++) {
    const password=suggestPassword();generated.add(password);
    assert.equal(password.length,20);assert.match(password,/[a-z]/);assert.match(password,/[A-Z]/);assert.match(password,/[0-9]/);assert.match(password,/[^a-zA-Z0-9]/);
    assert.equal(passwordStrength(password).label,'Strongest');
  }
  assert.equal(generated.size,20);
});
