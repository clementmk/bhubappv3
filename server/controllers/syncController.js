const { db } = require('../config/database');

// Sync all local changes from the mobile app to the cloud
const syncChanges = async (req, res) => {
  try {
    // Support both formats: direct { users, routes, completions, posts } or { type, data }
    let { users, routes, completions, posts } = req.body;
    
    // If data is sent in type/data format (from frontend syncService)
    if (req.body.data && !completions) {
      const items = req.body.data;
      if (req.body.type === 'route_completions') {
        completions = items;
      } else if (req.body.type === 'community_posts') {
        posts = items;
      } else if (req.body.type === 'routes') {
        routes = items;
      } else if (req.body.type === 'users') {
        users = items;
      }
    }

    const results = { users: 0, routes: 0, completions: 0, posts: 0, errors: [] };

    console.log('[Cloud] Sync request received - users:', users?.length || 0, 'routes:', routes?.length || 0, 'completions:', completions?.length || 0, 'posts:', posts?.length || 0);

    const runSync = (table, items, stmt, mapFn) => {
      return new Promise((resolve) => {
        if (!Array.isArray(items) || items.length === 0) return resolve();
        let done = 0;
        items.forEach((item) => {
          db.run(stmt, mapFn(item), (err) => {
            if (err) {
              console.log('[Cloud] Sync error for', table, ':', err.message);
              results.errors.push({ table, error: err.message });
            } else {
              results[table]++;
            }
            if (++done === items.length) resolve();
          });
        });
      });
    };

    await runSync('users', users,
      `INSERT OR REPLACE INTO users (username, name, email, points, highest_grade, posts, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      (u) => [u.username, u.name, u.email, u.points, u.highestGrade, u.posts]
    );

    await runSync('routes', routes,
      `INSERT OR REPLACE INTO routes (id, sector_id, code, name, grade, description, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      (r) => [r.id, r.sectorId, r.code, r.name, r.grade, r.description, r.isActive ? 1 : 0]
    );

    await runSync('completions', completions,
      `INSERT OR IGNORE INTO route_completions (route_id, username, attempts, video_url, created_at, synced)
       VALUES (?, ?, ?, ?, ?, 1)`,
      (c) => [c.routeId, c.username, c.attempts || 'Flash', c.videoUrl || null, c.createdAt || c.created_at || new Date().toISOString()]
    );

    await runSync('posts', posts,
      `INSERT OR IGNORE INTO community_posts (username, content, type, image_uri, video_uri, timestamp, synced)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      (p) => [p.username, p.content, p.type, p.imageUri, p.videoUri, p.timestamp]
    );

    console.log('[Cloud] Sync complete:', results);
    res.json({ success: true, synced: results });
  } catch (error) {
    console.log('[Cloud] Sync exception:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Get latest cloud data for the mobile app to pull
const getCloudData = async (req, res) => {
  try {
    const since = req.query.since || '1970-01-01';

    console.log('[Cloud] Fetching cloud data since:', since);

    const [routes, posts, news] = await Promise.all([
      new Promise((resolve, reject) =>
        db.all(`SELECT id, sector_id, code, name, grade, description, cover_photo, set_date, is_active, created_at FROM routes WHERE is_active = 1 AND created_at > ? ORDER BY created_at DESC LIMIT 100`, [since], (err, rows) => err ? reject(err) : resolve(rows))
      ),
      new Promise((resolve, reject) =>
        db.all(`SELECT id, username, content, type, image_uri, video_uri, likes, comments, shares, timestamp, created_at FROM community_posts WHERE created_at > ? ORDER BY created_at DESC LIMIT 50`, [since], (err, rows) => err ? reject(err) : resolve(rows))
      ),
      new Promise((resolve, reject) =>
        db.all(`SELECT id, title, subtitle, content, image_uri, category, created_at FROM news WHERE published = 1 AND created_at > ? ORDER BY created_at DESC LIMIT 20`, [since], (err, rows) => err ? reject(err) : resolve(rows))
      ),
    ]);

    console.log('[Cloud] Cloud data fetched - routes:', routes.length, 'posts:', posts.length, 'news:', news.length);
    res.json({ success: true, routes, posts, news, syncedAt: new Date().toISOString() });
  } catch (error) {
    console.log('[Cloud] Get cloud data exception:', error.message);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { syncChanges, getCloudData };
