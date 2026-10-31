export function migrateAddress(db) {
  const existing = new Set(db.prepare('PRAGMA table_info(members)').all().map(c => c.name));
  const columns = ['address1','address2','district','postcode','state','country'];
  db.exec('BEGIN IMMEDIATE');
  try {
    for (const column of columns) {
      if (!existing.has(column)) db.exec(`ALTER TABLE members ADD COLUMN ${column} TEXT NOT NULL DEFAULT ''`);
    }
    // Kekalkan alamat lama sepenuhnya; jangan teka pecahan atau poskod.
    if (!existing.has('address1')) db.exec('UPDATE members SET address1 = address');
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}

export function migrateMemberDetails(db) {
  const existing = new Set(db.prepare('PRAGMA table_info(members)').all().map(c => c.name));
  db.exec('BEGIN IMMEDIATE');
  try {
    for (const column of ['employmentStatus','educationLevel','studyLevel','employerName','employerAddress','employerPhone']) {
      if (!existing.has(column)) db.exec(`ALTER TABLE members ADD COLUMN ${column} TEXT NOT NULL DEFAULT ''`);
    }
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}

export function migrateMemberStatus(db) {
  const existing=new Set(db.prepare('PRAGMA table_info(members)').all().map(c=>c.name));
  db.exec('BEGIN IMMEDIATE');
  try {
    if(!existing.has('isActive')) db.exec('ALTER TABLE members ADD COLUMN isActive INTEGER NOT NULL DEFAULT 1 CHECK(isActive IN (0,1))');
    if(!existing.has('deactivatedAt')) db.exec("ALTER TABLE members ADD COLUMN deactivatedAt TEXT NOT NULL DEFAULT ''");
    if(!existing.has('inactivityReason')) db.exec("ALTER TABLE members ADD COLUMN inactivityReason TEXT NOT NULL DEFAULT ''");
    db.exec('COMMIT');
  } catch(error) { db.exec('ROLLBACK'); throw error; }
}

export function migrateEmployerAddress(db) {
  const existing=new Set(db.prepare('PRAGMA table_info(members)').all().map(c=>c.name));
  db.exec('BEGIN IMMEDIATE');
  try {
    for(const column of ['employerAddress1','employerAddress2','employerDistrict','employerPostcode','employerState','employerCountry']) {
      if(!existing.has(column)) db.exec(`ALTER TABLE members ADD COLUMN ${column} TEXT NOT NULL DEFAULT ''`);
    }
    if(!existing.has('employerAddress1')) db.exec('UPDATE members SET employerAddress1=employerAddress');
    db.exec('COMMIT');
  } catch(error) { db.exec('ROLLBACK');throw error; }
}

export function migrateMemberIdentity(db) {
  if(!db.prepare('PRAGMA table_info(members)').all().some(column=>column.name==='identityKey'))db.exec("ALTER TABLE members ADD COLUMN identityKey TEXT NOT NULL DEFAULT ''");
  db.exec(`UPDATE members SET identityKey=lower(hex(randomblob(16))) WHERE identityKey='';
    CREATE UNIQUE INDEX IF NOT EXISTS member_identity ON members(identityKey) WHERE identityKey!='';
    CREATE TRIGGER IF NOT EXISTS new_member_identity AFTER INSERT ON members WHEN NEW.identityKey='' BEGIN UPDATE members SET identityKey=lower(hex(randomblob(16))) WHERE id=NEW.id;END;`);
}
