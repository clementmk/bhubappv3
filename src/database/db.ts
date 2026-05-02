import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage';
import { seedUsers, seedDatabase, seedNewsData } from './seedData';

SQLite.enablePromise(true);

let db: SQLiteDatabase | null = null;
let dbInitialized = false;

export const getDB = async (): Promise<SQLiteDatabase> => {
  if (db) return db;
  db = await SQLite.openDatabase({ name: 'bhub.db', location: 'default' });
  return db;
};

/**
 * Wait until initDB has completed. Call this before any queries
 * that depend on the schema existing.
 */
export const waitForDB = (): Promise<void> => {
  return new Promise((resolve) => {
    if (dbInitialized) return resolve();
    const check = setInterval(() => {
      if (dbInitialized) {
        clearInterval(check);
        resolve();
      }
    }, 50);
  });
};

const SCHEMA_VERSION = 6; // Bump this to force a full re-migration

export const initDB = async (): Promise<void> => {
  const database = await getDB();

  // ── Schema version check ────────────────────────────────────────────────
  await database.executeSql(`
    CREATE TABLE IF NOT EXISTS schema_info (
      key   TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  let needsMigration = false;
  const [verResult] = await database.executeSql(
    "SELECT value FROM schema_info WHERE key = 'version';",
  );
  if (verResult.rows.length === 0) {
    needsMigration = true;
  } else {
    const currentVersion = parseInt(verResult.rows.item(0).value, 10);
    if (currentVersion < SCHEMA_VERSION) {
      needsMigration = true;
    }
  }

  if (needsMigration) {
    console.log(`[DB] Migrating to schema version ${SCHEMA_VERSION} — dropping all tables...`);
    const tables = ['community_posts', 'betas', 'route_completions', 'route_tags', 'routes', 'sectors', 'news', 'posts', 'users'];
    for (const t of tables) {
      await database.executeSql(`DROP TABLE IF EXISTS ${t};`);
    }
    await database.executeSql(
      `INSERT OR REPLACE INTO schema_info (key, value) VALUES ('version', ?);`,
      [SCHEMA_VERSION.toString()],
    );
  }

  // ── Users ──────────────────────────────────────────────────────────────────
  await database.executeSql(`
    CREATE TABLE IF NOT EXISTS users (
      username          TEXT PRIMARY KEY,
      name              TEXT NOT NULL,
      email             TEXT NOT NULL UNIQUE,
      password          TEXT NOT NULL,
      avatar            TEXT,
      posts             INTEGER DEFAULT 0,
      points            INTEGER DEFAULT 0,    
      highest_grade     TEXT DEFAULT 'V0',    
      membershipType    TEXT DEFAULT 'Standard Pass',
      membershipExpiry  TEXT,
      created_at        TEXT
    );
  `);

  // ── Sectors ────────────────────────────────────────────────────────────────
  await database.executeSql(`
    CREATE TABLE IF NOT EXISTS sectors (
      id       TEXT PRIMARY KEY,
      name     TEXT NOT NULL,
      label_x  REAL DEFAULT 0.5,
      label_y  REAL DEFAULT 0.5,
      color    TEXT DEFAULT '#FE8004',
      image_url TEXT
    );
  `);

  // ── Routes ─────────────────────────────────────────────────────────────────
  await database.executeSql(`
    CREATE TABLE IF NOT EXISTS routes (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      sector_id   TEXT NOT NULL,
      code        TEXT NOT NULL,
      name        TEXT NOT NULL,
      grade       TEXT,
      description TEXT,
      cover_photo TEXT,
      set_date    TEXT,
      is_active   INTEGER DEFAULT 1,
      FOREIGN KEY (sector_id) REFERENCES sectors(id)
    );
  `);

  // ── Route Tags ─────────────────────────────────────────────────────────────
  await database.executeSql(`
    CREATE TABLE IF NOT EXISTS route_tags (
      route_id INTEGER,
      tag      TEXT,
      FOREIGN KEY (route_id) REFERENCES routes(id)
    );
  `);

  // ── Betas ──────────────────────────────────────────────────────────────────
  await database.executeSql(`
    CREATE TABLE IF NOT EXISTS betas (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      route_id         INTEGER,
      username         TEXT,
      video_url        TEXT,
      video_local_path TEXT,
      likes            INTEGER DEFAULT 0,
      created_at       TEXT,
      FOREIGN KEY (route_id) REFERENCES routes(id),
      FOREIGN KEY (username) REFERENCES users(username)
    );
  `);

  // ── Route Completions ──────────────────────────────────────────────────────
  await database.executeSql(`
    CREATE TABLE IF NOT EXISTS route_completions (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      route_id         INTEGER,
      username         TEXT,
      attempts         TEXT,
      video_url        TEXT,
      video_local_path TEXT,
      created_at       TEXT,
      synced           INTEGER DEFAULT 0,
      FOREIGN KEY (route_id) REFERENCES routes(id),
      FOREIGN KEY (username) REFERENCES users(username)
    );
  `);

  // ── Community Posts ────────────────────────────────────────────────────────
  await database.executeSql(`
    CREATE TABLE IF NOT EXISTS community_posts (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      username    TEXT NOT NULL,
      content     TEXT,
      type        TEXT DEFAULT 'text',
      image_uri   TEXT,
      video_uri   TEXT,
      likes       INTEGER DEFAULT 0,
      comments    INTEGER DEFAULT 0,
      shares      INTEGER DEFAULT 0,
      timestamp   TEXT,
      created_at  TEXT,
      synced      INTEGER DEFAULT 0,
      FOREIGN KEY (username) REFERENCES users(username)
    );
  `);

  // ── News ───────────────────────────────────────────────────────────────────
  await database.executeSql(`
    CREATE TABLE IF NOT EXISTS news (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT NOT NULL,
      subtitle    TEXT,
      image_uri   TEXT,
      created_at  TEXT
    );
  `);

  // ── Seed data if empty ─────────────────────────────────────────────────────
  try {
    const [userCheck] = await database.executeSql('SELECT COUNT(*) as cnt FROM users;');
    if (userCheck.rows.item(0).cnt === 0) {
      console.log('[DB] Seeding default user...');
      await seedUsers(database);
      console.log('[DB] Default user seeded.');
    }
  } catch (err) {
    console.error('[DB] Failed to seed users:', err);
  }

  try {
    const [sectorCheck] = await database.executeSql('SELECT COUNT(*) as cnt FROM sectors;');
    if (sectorCheck.rows.item(0).cnt === 0) {
      console.log('[DB] Seeding sectors & routes...');
      await seedDatabase(database);
      console.log('[DB] Sectors & routes seeded.');
    }
  } catch (err) {
    console.error('[DB] Failed to seed sectors:', err);
  }

  try {
    const [newsCheck] = await database.executeSql('SELECT COUNT(*) as cnt FROM news;');
    if (newsCheck.rows.item(0).cnt === 0) {
      console.log('[DB] Seeding news...');
      await seedNewsData(database);
    }
  } catch (err) {
    console.error('[DB] Failed to seed news:', err);
  }



  // Ensure routes for K and M are removed if they were previously seeded
  await database.executeSql(`DELETE FROM routes WHERE sector_id IN ('K', 'M');`);

  dbInitialized = true;
  console.log('[DB] Database ready ✅');
};
