const { db } = require('../config/database');

// Get latest routes (active only)
const getLatestRoutes = async (req, res) => {
  try {
    db.all(`
      SELECT r.id, r.sector_id, r.code, r.name, r.grade, r.description, r.cover_photo, r.set_date, r.is_active, r.created_at,
             s.name as sector_name,
             GROUP_CONCAT(rt.tag) as tags
      FROM routes r
      LEFT JOIN sectors s ON r.sector_id = s.id
      LEFT JOIN route_tags rt ON r.id = rt.route_id
      WHERE r.is_active = 1
      GROUP BY r.id
      ORDER BY r.created_at DESC
      LIMIT 50
    `, [], (err, rows) => {
      if (err) {
        console.log('[Cloud] Get latest routes error:', err.message);
        return res.status(500).json({ error: err.message });
      }

      console.log('[Cloud] Fetched', rows.length, 'routes');
      const routes = rows.map(row => ({
        ...row,
        tags: row.tags ? row.tags.split(',') : [],
      }));

      res.json({ success: true, routes });
    });
  } catch (error) {
    console.log('[Cloud] Get latest routes exception:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Get single route by ID
const getRouteById = async (req, res) => {
  try {
    const { id } = req.params;

    db.get(`
      SELECT r.id, r.sector_id, r.code, r.name, r.grade, r.description, r.cover_photo, r.set_date, r.is_active, r.created_at,
             s.name as sector_name,
             GROUP_CONCAT(rt.tag) as tags
      FROM routes r
      LEFT JOIN sectors s ON r.sector_id = s.id
      LEFT JOIN route_tags rt ON r.id = rt.route_id
      WHERE r.id = ?
      GROUP BY r.id
    `, [id], (err, row) => {
      if (err) {
        console.log('[Cloud] Get route error:', err.message);
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        console.log('[Cloud] Route not found:', id);
        return res.status(404).json({ error: 'Route not found' });
      }

      row.tags = row.tags ? row.tags.split(',') : [];
      console.log('[Cloud] Route fetched:', id);
      res.json({ success: true, route: row });
    });
  } catch (error) {
    console.log('[Cloud] Get route exception:', error.message);
    res.status(500).json({ error: error.message });
  }
};
//getusersend
const getUserSends = async (req, res) => {
  const { username } = req.params;
  
  db.all(`
    SELECT rc.id, rc.route_id, rc.attempts, rc.created_at, 
           r.name as routeName, r.grade as routeGrade, s.name as sectorName
    FROM route_completions rc
    JOIN routes r ON rc.route_id = r.id
    LEFT JOIN sectors s ON r.sector_id = s.id
    WHERE LOWER(rc.username) = LOWER(?)
    ORDER BY rc.created_at DESC
  `, [username], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows); // Return the array of sends
  });
};

// Submit a route completion
const submitRouteCompletion = async (req, res) => {
  // 1. Define the point values for each grade
  const GRADE_POINTS = {
    'V0': 100, 'V1': 200, 'V2': 300, 'V3': 400,
    'V4': 500, 'V5': 600, 'V6': 700, 'V7': 800, 'V8': 1000
  };

  try {
    const routeId = parseInt(req.body.routeId, 10);
    const { username, attempts, videoUrl } = req.body;

    if (isNaN(routeId) || !username) {
      return res.status(400).json({ error: 'Invalid routeId or missing username' });
    }

    // Step A: Check if user exists
    db.get('SELECT username, points, highest_grade FROM users WHERE LOWER(username) = LOWER(?)', [username], (err, user) => {
      if (err || !user) return res.status(400).json({ error: 'User not found' });

      const validUsername = user.username;
      const currentHighestGrade = user.highest_grade || 'V0';

      // Step B: Get the route grade to determine points
      db.get('SELECT grade FROM routes WHERE id = ?', [routeId], (err, route) => {
        if (err) return res.status(500).json({ error: err.message });

        // Default to V0 if route grade is missing
        const routeGrade = route ? route.grade : 'V0';
        const pointsToAdd = GRADE_POINTS[routeGrade] || 0;

        // Step C: Insert the completion
        db.run(`
          INSERT INTO route_completions (route_id, username, attempts, video_url, created_at)
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [routeId, validUsername, attempts || 'Flash', videoUrl || null], function(err) {
          if (err) return res.status(500).json({ error: err.message });

          const completionId = this.lastID;

          // Update user's points, posts, and highest_grade
          const currentHighestPoints = GRADE_POINTS[currentHighestGrade] || 0;
          const newHighestGrade = pointsToAdd > currentHighestPoints ? routeGrade : currentHighestGrade;

          db.run(`
            UPDATE users SET points = points + ?, posts = posts + 1, highest_grade = ? WHERE username = ?
          `, [pointsToAdd, newHighestGrade, validUsername], (updateErr) => {
            if (updateErr) console.error('[Cloud] Failed to update points:', updateErr.message);

            console.log(`[Cloud] Success: ${validUsername} earned ${pointsToAdd} points!`);

            // Broadcast real-time event
            const io = req.app.get('io');
            io.emit('route_completed', { routeId, username: validUsername, attempts });
            io.emit('leaderboard_updated');

            res.status(201).json({
              success: true,
              id: completionId,
              pointsEarned: pointsToAdd,
              message: 'Route completion recorded and points added'
            });
          });
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// Sync routes from mobile app
const syncRoutes = async (req, res) => {
  try {
    const { routes } = req.body;
    if (!Array.isArray(routes)) {
      console.log('[Cloud] Sync routes failed: Invalid routes format');
      return res.status(400).json({ error: 'routes must be an array' });
    }

    console.log('[Cloud] Syncing', routes.length, 'routes from tablet');
    let synced = 0;
    const errors = [];

    const syncNext = (index) => {
      if (index >= routes.length) {
        console.log('[Cloud] Sync complete:', synced, 'routes synced');
        return res.json({ synced, errors, message: `${synced} routes synced` });
      }

      const r = routes[index];
      db.run(`
        INSERT OR REPLACE INTO routes (id, sector_id, code, name, grade, description, cover_photo, set_date, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [r.id, r.sectorId, r.code, r.name, r.grade, r.description, r.coverPhoto, r.setDate, r.isActive ? 1 : 0],
      (err) => {
        if (err) {
          console.log('[Cloud] Sync error for route', r.id, ':', err.message);
          errors.push({ id: r.id, error: err.message });
        } else {
          synced++;
        }
        syncNext(index + 1);
      });
    };

    syncNext(0);
  } catch (error) {
    console.log('[Cloud] Sync routes exception:', error.message);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getLatestRoutes, getRouteById, submitRouteCompletion, syncRoutes ,getUserSends};
