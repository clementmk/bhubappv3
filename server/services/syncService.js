const { db } = require('../config/database');

// Pull all data that has changed since a given timestamp
const pullLatestData = (since = '1970-01-01') => {
  return new Promise((resolve, reject) => {
    const result = {};

    db.all(`SELECT * FROM routes WHERE is_active = 1 AND created_at > ? ORDER BY created_at DESC LIMIT 100`, [since], (err, routes) => {
      if (err) return reject(err);
      result.routes = routes;

      db.all(`SELECT * FROM community_posts WHERE created_at > ? ORDER BY created_at DESC LIMIT 50`, [since], (err, posts) => {
        if (err) return reject(err);
        result.posts = posts;

        db.all(`SELECT * FROM news WHERE published = 1 AND created_at > ? ORDER BY created_at DESC LIMIT 20`, [since], (err, news) => {
          if (err) return reject(err);
          result.news = news;
          result.syncedAt = new Date().toISOString();
          resolve(result);
        });
      });
    });
  });
};

// Push a batch of local changes to the cloud DB
const pushLocalChanges = ({ users = [], routes = [], completions = [], posts = [] }) => {
  return new Promise((resolve) => {
    const results = { users: 0, routes: 0, completions: 0, posts: 0, errors: [] };
    let pending = 0;

    const done = () => {
      pending--;
      if (pending === 0) resolve(results);
    };

    const run = (stmt, params, key) => {
      pending++;
      db.run(stmt, params, (err) => {
        if (err) results.errors.push({ key, error: err.message });
        else results[key]++;
        done();
      });
    };

    // If nothing to sync, resolve immediately
    const total = users.length + routes.length + completions.length + posts.length;
    if (total === 0) return resolve(results);

    users.forEach(u => run(
      `INSERT OR REPLACE INTO users (username, name, email, points, highest_grade, posts) VALUES (?, ?, ?, ?, ?, ?)`,
      [u.username, u.name, u.email, u.points, u.highestGrade, u.posts], 'users'
    ));

    routes.forEach(r => run(
      `INSERT OR REPLACE INTO routes (id, sector_id, code, name, grade, description, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [r.id, r.sectorId, r.code, r.name, r.grade, r.description, r.isActive ? 1 : 0], 'routes'
    ));

    completions.forEach(c => run(
      `INSERT OR IGNORE INTO route_completions (route_id, username, attempts, video_url, created_at, synced) VALUES (?, ?, ?, ?, ?, 1)`,
      [c.routeId, c.username, c.attempts, c.videoUrl, c.createdAt], 'completions'
    ));

    posts.forEach(p => run(
      `INSERT OR IGNORE INTO community_posts (username, content, type, image_uri, video_uri, timestamp, synced) VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [p.username, p.content, p.type, p.imageUri, p.videoUri, p.timestamp], 'posts'
    ));
  });
};

module.exports = { pullLatestData, pushLocalChanges };
