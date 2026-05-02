const sqlite3 = require('sqlite3').verbose();

const dbPath = process.env.DATABASE_PATH ;
const db = new sqlite3.Database(dbPath);

// Enable foreign keys support
db.run('PRAGMA foreign_keys = ON');

const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          username TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password TEXT,
          avatar TEXT,
          followers INTEGER DEFAULT 0,
          following INTEGER DEFAULT 0,
          posts INTEGER DEFAULT 0,
          points INTEGER DEFAULT 0,
          highest_grade TEXT DEFAULT 'V0',
          membership_type TEXT DEFAULT 'Standard Pass',
          membership_expiry TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, () => {
        // Attempt to add columns if they don't exist (fails silently if they do)
        db.run("ALTER TABLE users ADD COLUMN membership_type TEXT DEFAULT 'Standard Pass'", () => {});
        db.run("ALTER TABLE users ADD COLUMN membership_expiry TEXT", () => {});
      });

      db.run(`
        CREATE TABLE IF NOT EXISTS sectors (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          label_x REAL DEFAULT 0.5,
          label_y REAL DEFAULT 0.5,
          color TEXT DEFAULT '#FE8004',
          image_url TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS routes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sector_id TEXT NOT NULL,
          code TEXT NOT NULL,
          name TEXT NOT NULL,
          grade TEXT NOT NULL,
          description TEXT,
          cover_photo TEXT,
          set_date DATE,
          is_active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (sector_id) REFERENCES sectors(id)
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS route_tags (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          route_id INTEGER NOT NULL,
          tag TEXT NOT NULL,
          FOREIGN KEY (route_id) REFERENCES routes(id)
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS route_completions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          route_id INTEGER NOT NULL,
          username TEXT NOT NULL,
          attempts TEXT DEFAULT 'Flash',
          video_url TEXT,
          video_local_path TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          synced INTEGER DEFAULT 0
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS betas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          route_id INTEGER NOT NULL,
          username TEXT NOT NULL,
          video_url TEXT,
          video_local_path TEXT,
          likes INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (route_id) REFERENCES routes(id),
          FOREIGN KEY (username) REFERENCES users(username)
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS community_posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL,
          content TEXT NOT NULL,
          type TEXT DEFAULT 'text',
          image_uri TEXT,
          video_uri TEXT,
          likes INTEGER DEFAULT 0,
          comments INTEGER DEFAULT 0,
          shares INTEGER DEFAULT 0,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          synced INTEGER DEFAULT 0,
          FOREIGN KEY (username) REFERENCES users(username)
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS news (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          subtitle TEXT,
          content TEXT,
          image_uri TEXT,
          category TEXT DEFAULT 'general',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          published INTEGER DEFAULT 1
        )
      `, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  });
};

module.exports = { db, initDatabase };
