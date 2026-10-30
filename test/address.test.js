import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { migrateAddress } from '../migrations.js';
import { formatAddress, postcodeSuggestions } from '../public/address.js';

test('Naik taraf alamat mengekalkan teks asal dan selamat dijalankan semula', () => {
  const db=new DatabaseSync(':memory:');
  try {
    db.exec("CREATE TABLE members (id INTEGER PRIMARY KEY, address TEXT NOT NULL); INSERT INTO members VALUES (1, 'No. 1, Kampung Ujian, 05000 Alor Setar, Kedah');");
    const original=db.prepare('SELECT address FROM members').get().address;
    migrateAddress(db);
    let row=db.prepare('SELECT * FROM members').get();
    assert.equal(row.address,original); assert.equal(row.address1,original);
    for (const field of ['address2','district','postcode','state','country']) assert.equal(row[field],'');
    db.prepare('UPDATE members SET address1=?,postcode=?,state=? WHERE id=1').run('No. 1, Kampung Ujian','05000','Kedah');
    migrateAddress(db);
    row=db.prepare('SELECT * FROM members').get();
    assert.equal(row.address1,'No. 1, Kampung Ujian');assert.equal(row.postcode,'05000');assert.equal(row.address,original);
  } finally { db.close(); }
});

test('Cadangan poskod perlu padanan daerah, negeri dan negara; kekalkan sifar awal', () => {
  const area={district:'Kota Setar',state:'Kedah',country:'Malaysia'};
  const members=[{...area,postcode:'05000'},{...area,postcode:'05100'},{...area,postcode:'05000'},{...area,postcode:'abc'},{...area,district:'Daerah lain',postcode:'06000'},{...area,state:'Negeri lain',postcode:'07000'},{...area,country:'Negara lain',postcode:'08000'}];
  assert.deepEqual(postcodeSuggestions(members,{...area,district:'  kota  setar '}),['05000','05100']);
  assert.deepEqual(postcodeSuggestions(members,{...area,district:''}),[]);
  assert.deepEqual(postcodeSuggestions(members,{...area,state:''}),[]);
  assert.deepEqual(postcodeSuggestions(members,{...area,country:'Thailand'}),[]);
  assert.deepEqual(postcodeSuggestions([],area),[]);
});

test('Paparan alamat menggabungkan medan berasingan tanpa nilai kosong', () => {
  assert.equal(formatAddress({address1:'No. 1',address2:'Kampung Ujian',district:'Kota Setar',postcode:'05000',state:'Kedah',country:'Malaysia'}),'No. 1\nKampung Ujian\n05000 Kota Setar\nKedah\nMalaysia');
  assert.equal(formatAddress({address1:'Alamat lama'}),'Alamat lama');
});
