import {familyResidenceFields} from './public/family-residence.js';
import {residentFields,housingFields} from './public/resident-fields.js';
import {withAudit} from './accounts.js';
export function initializeHousing(db){
 db.exec('BEGIN IMMEDIATE');try{
  const existing=new Set(db.prepare('PRAGMA table_info(members)').all().map(c=>c.name));for(const col of ['householdKey',...residentFields,...housingFields])if(!existing.has(col))db.exec(`ALTER TABLE members ADD COLUMN ${col} TEXT NOT NULL DEFAULT ''`);
  db.exec(`CREATE TABLE IF NOT EXISTS community_zones(id INTEGER PRIMARY KEY,code TEXT NOT NULL UNIQUE,name TEXT NOT NULL,isActive INTEGER NOT NULL CHECK(isActive IN(0,1)),updatedAt TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS housing_types(id INTEGER PRIMARY KEY,code TEXT NOT NULL UNIQUE,name TEXT NOT NULL,isActive INTEGER NOT NULL CHECK(isActive IN(0,1)),updatedAt TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS households(id INTEGER PRIMARY KEY,headMemberId INTEGER NOT NULL UNIQUE REFERENCES members(id) ON DELETE CASCADE,zoneId INTEGER REFERENCES community_zones(id),housingTypeId INTEGER REFERENCES housing_types(id),houseReference TEXT NOT NULL,latitude TEXT NOT NULL,longitude TEXT NOT NULL,address1 TEXT NOT NULL,address2 TEXT NOT NULL,district TEXT NOT NULL,postcode TEXT NOT NULL,state TEXT NOT NULL,country TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS family_members(id INTEGER PRIMARY KEY AUTOINCREMENT,householdId INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,position INTEGER NOT NULL,name TEXT NOT NULL,relationship TEXT NOT NULL,birthDate TEXT NOT NULL,employmentStatus TEXT NOT NULL,educationLevel TEXT NOT NULL,studyLevel TEXT NOT NULL,${residentFields.map(k=>`${k} TEXT NOT NULL DEFAULT ''`).join(',')},UNIQUE(householdId,position));`);
  const houseExisting=new Set(db.prepare('PRAGMA table_info(households)').all().map(c=>c.name));if(!houseExisting.has('householdKey'))db.exec("ALTER TABLE households ADD COLUMN householdKey TEXT NOT NULL DEFAULT ''");
  const familyExisting=new Set(db.prepare('PRAGMA table_info(family_members)').all().map(c=>c.name));for(const column of ['personKey',...familyResidenceFields])if(!familyExisting.has(column))db.exec(`ALTER TABLE family_members ADD COLUMN ${column} TEXT NOT NULL DEFAULT ''`);
  const houseCols=['houseReference','latitude','longitude','address1','address2','district','postcode','state','country'];
  const familyCols=['name','relationship','birthDate','employmentStatus','educationLevel','studyLevel','personKey',...residentFields,...familyResidenceFields];
  const sync=`UPDATE members SET householdKey=CASE WHEN householdKey='' THEN lower(hex(randomblob(16))) ELSE householdKey END,
   household=CASE WHEN EXISTS(SELECT 1 FROM json_each(household) WHERE coalesce(json_extract(value,'$.personKey'),'')='') THEN (SELECT coalesce(json_group_array(json_set(value,'$.personKey',CASE WHEN coalesce(json_extract(value,'$.personKey'),'')='' THEN lower(hex(randomblob(16))) ELSE json_extract(value,'$.personKey') END)),'[]') FROM json_each(household)) ELSE household END
   WHERE id=NEW.id AND (householdKey='' OR EXISTS(SELECT 1 FROM json_each(household) WHERE coalesce(json_extract(value,'$.personKey'),'')=''));
   INSERT INTO households(headMemberId,householdKey,zoneId,housingTypeId,${houseCols.join(',')}) VALUES(NEW.id,(SELECT householdKey FROM members WHERE id=NEW.id),(SELECT id FROM community_zones WHERE code=NEW.zoneCode),(SELECT id FROM housing_types WHERE code=NEW.housingTypeCode),${houseCols.map(k=>'NEW.'+k).join(',')}) ON CONFLICT(headMemberId) DO UPDATE SET householdKey=excluded.householdKey,zoneId=excluded.zoneId,housingTypeId=excluded.housingTypeId,${houseCols.map(k=>`${k}=excluded.${k}`).join(',')};
   DELETE FROM family_members WHERE householdId=(SELECT id FROM households WHERE headMemberId=NEW.id) AND NOT EXISTS(SELECT 1 FROM json_each((SELECT household FROM members WHERE id=NEW.id)) j WHERE CAST(j.key AS INTEGER)=family_members.position AND ${familyCols.map(k=>`coalesce(json_extract(j.value,'$.${k}'),'')=family_members.${k}`).join(' AND ')});
   INSERT INTO family_members(householdId,position,${familyCols.join(',')}) SELECT (SELECT id FROM households WHERE headMemberId=NEW.id),CAST(j.key AS INTEGER),${familyCols.map(k=>`coalesce(json_extract(j.value,'$.${k}'),'')`).join(',')} FROM json_each((SELECT household FROM members WHERE id=NEW.id)) j WHERE NOT EXISTS(SELECT 1 FROM family_members f WHERE f.householdId=(SELECT id FROM households WHERE headMemberId=NEW.id) AND f.position=CAST(j.key AS INTEGER));`;
  for(const [name,event] of [['resident_insert','INSERT'],['resident_update','UPDATE OF household,householdKey,zoneCode,housingTypeCode,houseReference,latitude,longitude,address1,address2,district,postcode,state,country']])db.exec(`DROP TRIGGER IF EXISTS ${name};CREATE TRIGGER ${name} AFTER ${event} ON members BEGIN ${sync} END;`);
  db.exec("UPDATE members SET household=household;CREATE UNIQUE INDEX IF NOT EXISTS household_identity ON members(householdKey) WHERE householdKey!='';CREATE UNIQUE INDEX IF NOT EXISTS family_person_identity ON family_members(personKey) WHERE personKey!='';");db.exec('COMMIT');
 }catch(e){db.exec('ROLLBACK');throw e;}
}
export function housingCatalog(db){return {zones:db.prepare('SELECT * FROM community_zones ORDER BY code').all(),housingTypes:db.prepare('SELECT * FROM housing_types ORDER BY code').all()};}
function validateItem(input){const code=typeof input.code==='string'?input.code.trim().toUpperCase():'',name=typeof input.name==='string'?input.name.trim():'';if(!/^[A-Z0-9_-]{1,30}$/.test(code)||!name||name.length>150||![0,1].includes(input.isActive))throw Error('Sila isi kod (huruf/nombor/_/-), nama dan status yang sah.');return {code,name,isActive:input.isActive};}
export function readHousing(input){
 if(input.version<6)return {zones:[],housingTypes:[]};const result={};for(const kind of ['zones','housingTypes']){const ids=new Set(),codes=new Set();if(!Array.isArray(input.housing?.[kind])||input.housing[kind].length>20000)throw Error('Maklumat katalog rumah dalam sandaran tidak sah.');result[kind]=input.housing[kind].map(r=>{const v=validateItem(r);if(!Number.isSafeInteger(r.id)||r.id<1||ids.has(r.id)||codes.has(v.code)||!Number.isFinite(Date.parse(r.updatedAt)))throw Error('Maklumat katalog rumah berganda atau tidak sah.');ids.add(r.id);codes.add(v.code);return {...v,id:r.id,updatedAt:r.updatedAt};});}return result;
}
export function checkHousing(db,data){for(const [k,table] of [['zoneCode','community_zones'],['housingTypeCode','housing_types']])if(data[k]&&!db.prepare(`SELECT id FROM ${table} WHERE code=?`).get(data[k]))throw Error('Sila pilih zon dan jenis rumah yang terdapat dalam katalog.');}
export async function housingRoutes({req,res,path,user,db,json,body}){
 if(path==='/api/housing/catalog'&&req.method==='GET'){json(res,200,housingCatalog(db));return true;}
 const match=path.match(/^\/api\/housing\/(zones|types)(?:\/(\d+))?$/);if(!match)return false;
 if(user.role!=='admin'){json(res,403,{error:'Katalog rumah hanya boleh diurus oleh pentadbir.'});return true;}
 const table=match[1]==='zones'?'community_zones':'housing_types';
 if((req.method==='POST'&&!match[2])||(req.method==='PUT'&&match[2])){const input=await body(req),data=validateItem(input),old=match[2]?db.prepare(`SELECT * FROM ${table} WHERE id=?`).get(Number(match[2])):null;
  if(match[2]&&!old){json(res,404,{error:'Rekod katalog tidak ditemui.'});return true;}
  if(old&&(old.updatedAt!==input.expectedUpdatedAt||old.code!==data.code)){json(res,409,{error:'Kod tidak boleh diubah; muat semula katalog dan semak rekod.'});return true;}
  if(!old&&db.prepare(`SELECT id FROM ${table} WHERE code=?`).get(data.code)){json(res,409,{error:'Kod sudah digunakan.'});return true;}
  const now=new Date().toISOString(),result=withAudit(db,user,old?'Kemas kini katalog rumah':'Tambah katalog rumah',table,old?.id,()=>old?db.prepare(`UPDATE ${table} SET name=?,isActive=?,updatedAt=? WHERE id=?`).run(data.name,data.isActive,now,old.id):db.prepare(`INSERT INTO ${table}(code,name,isActive,updatedAt) VALUES(?,?,?,?)`).run(data.code,data.name,data.isActive,now));json(res,old?200:201,{id:old?.id||Number(result.lastInsertRowid)});return true;
 }json(res,405,{error:'Kaedah tidak disokong. Gunakan status tidak aktif untuk mengekalkan sejarah.'});return true;
}
