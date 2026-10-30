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
