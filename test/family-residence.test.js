import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from '../sqlite.js';
import {normalizeFamilyResidence,familyResidenceAddress,familyResidenceFields} from '../public/family-residence.js';
import {initializeHousing} from '../housing.js';
import {migrateAddress,migrateMemberDetails,migrateMemberStatus,migrateEmployerAddress,migrateMemberIdentity} from '../migrations.js';

test('Kediaman keluarga tidak bersama memerlukan alamat dan mengekalkan sifar poskod',()=>{
 assert.throws(()=>normalizeFamilyResidence({livesWithMember:'Tidak'}),/Alamat 1 dan negara/);
 assert.throws(()=>normalizeFamilyResidence({livesWithMember:'Tidak',residenceAddress1:'Rumah'}),/negara/);
 assert.throws(()=>normalizeFamilyResidence({livesWithMember:'Tidak',residenceAddress1:'Rumah',residenceCountry:'Malaysia',residencePostcode:'1234'}),/poskod/);
 const v=normalizeFamilyResidence({livesWithMember:'Tidak',residenceAddress1:' Rumah lain ',residenceCountry:'Malaysia',residencePostcode:'05000',residenceState:'Kedah'});assert.equal(v.residenceAddress1,'Rumah lain');assert.equal(v.residencePostcode,'05000');assert.equal(v.residenceState,'Kedah');
 assert.equal(normalizeFamilyResidence({...v,residencePostcode:''}).residencePostcode,'');assert.equal(normalizeFamilyResidence({...v,residenceCountry:'United Kingdom',residencePostcode:'SW1A 1AA'}).residencePostcode,'SW1A 1AA');
});
test('Tinggal bersama menggunakan alamat utama terkini dan membersihkan alamat berasingan',()=>{
 const v=normalizeFamilyResidence({livesWithMember:'Ya',residenceAddress1:'Alamat lama',residenceCountry:'Malaysia'});assert.equal(v.residenceAddress1,'');assert.equal(v.residenceCountry,'');assert.equal(familyResidenceAddress(v,{address:'Alamat utama baharu'}),'Alamat utama baharu');assert.match(familyResidenceAddress({livesWithMember:'Tidak',residenceAddress1:'Rumah sendiri',residenceCountry:'Malaysia'},{address:'Rumah utama'}),/Rumah sendiri/);
});
test('Rekod lama kekal belum diketahui dan nilai status/jenis yang tidak sah ditolak',()=>{
 assert.deepEqual(normalizeFamilyResidence({name:'Ahli lama'}),{});assert.equal(familyResidenceAddress({}, {address:'Tidak boleh diandaikan'}),'');
 assert.throws(()=>normalizeFamilyResidence({livesWithMember:'Mungkin'}));assert.throws(()=>normalizeFamilyResidence({livesWithMember:true}));assert.throws(()=>normalizeFamilyResidence({livesWithMember:'',residenceAddress1:'Alamat tanpa status'}));assert.throws(()=>normalizeFamilyResidence({livesWithMember:'Tidak',residenceAddress1:'x'.repeat(1001),residenceCountry:'Malaysia'}));
});
test('Naik taraf jadual keluarga sedia ada menambah kediaman tanpa mengubah keluarga lama',()=>{
 const db=new DatabaseSync(':memory:');try{
 db.exec('PRAGMA foreign_keys=ON;CREATE TABLE members(id INTEGER PRIMARY KEY,name TEXT,phone TEXT,birthDate TEXT,gender TEXT,occupation TEXT,address TEXT,household TEXT,createdAt TEXT,updatedAt TEXT)');const family=JSON.stringify([{name:'Anak lama',relationship:'Anak',birthDate:''}]);db.prepare('INSERT INTO members VALUES(1,?,?,?,?,?,?,?,?,?)').run('Ketua','0123456789','','','','Alamat utama',family,'2026-01-01','2026-01-01');
 for(const fn of [migrateAddress,migrateMemberDetails,migrateMemberStatus,migrateEmployerAddress,migrateMemberIdentity])fn(db);initializeHousing(db);const id=db.prepare('SELECT id FROM family_members').get().id;
 db.exec('DROP TRIGGER resident_insert;DROP TRIGGER resident_update');for(const key of familyResidenceFields)db.exec(`ALTER TABLE family_members DROP COLUMN ${key}`);
 initializeHousing(db);initializeHousing(db);const row=db.prepare('SELECT * FROM family_members').get();assert.equal(row.id,id);assert.equal(row.livesWithMember,'');assert.equal(row.residenceAddress1,'');assert.deepEqual(JSON.parse(db.prepare('SELECT household FROM members').get().household).map(({personKey,...p})=>p),JSON.parse(family));assert.match(db.prepare('SELECT personKey FROM family_members').get().personKey,/^[a-f0-9]{32}$/);assert.equal(db.prepare('PRAGMA foreign_key_check').all().length,0);
 }finally{db.close();}
});
