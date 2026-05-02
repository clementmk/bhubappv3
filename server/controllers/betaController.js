const { db } = require('../config/database');

const uploadBetaVideo = async (req, res) => {
  try {
    const { routeId, username } = req.body;
    const file = req.file;

    if (!file || !routeId || !username) {
      console.log('[Cloud] Upload beta failed: Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate user exists
    db.get('SELECT username FROM users WHERE username = ?', [username], (err, user) => {
      if (err) {
        console.log('[Cloud] Upload beta error (user check):', err.message);
        return res.status(500).json({ error: err.message });
      }
      if (!user) {
        console.log('[Cloud] Upload beta failed: User not found:', username);
        return res.status(400).json({ error: 'User does not exist' });
      }

      // Validate route exists
      db.get('SELECT id FROM routes WHERE id = ?', [routeId], (err, route) => {
        if (err) {
          console.log('[Cloud] Upload beta error (route check):', err.message);
          return res.status(500).json({ error: err.message });
        }
        if (!route) {
          console.log('[Cloud] Upload beta failed: Route not found:', routeId);
          return res.status(400).json({ error: 'Route does not exist' });
        }

        const videoUrl = `/uploads/betas/${file.filename}`;

        db.run(`
          INSERT INTO betas (route_id, username, video_url, video_local_path, likes, created_at)
          VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
        `, [routeId, username, videoUrl, file.path], function(err) {
          if (err) {
            console.log('[Cloud] Upload beta insert error:', err.message);
            return res.status(500).json({ error: err.message });
          }

          const betaId = this.lastID;
          console.log('[Cloud] Beta video uploaded:', betaId, 'for route', routeId, 'by', username);
          
          res.status(201).json({ 
            success: true,
            id: betaId,
            route_id: routeId,
            username,
            video_url: videoUrl,
            message: 'Beta video uploaded'
          });
        });
      });
    });
  } catch (error) {
    console.log('[Cloud] Upload beta exception:', error.message);
    res.status(500).json({ error: error.message });
  }
};

const getBetasForRoute = async (req, res) => {
  try {
    const routeId = req.params.routeId;
    db.all(`
      SELECT b.id, b.route_id, b.username, b.video_url, b.video_local_path, b.likes, b.created_at,
             u.name as user_name 
      FROM betas b
      LEFT JOIN users u ON b.username = u.username
      WHERE b.route_id = ?
      ORDER BY b.likes DESC
    `, [routeId], (err, rows) => {
      if (err) {
        console.log('[Cloud] Get betas error:', err.message);
        return res.status(500).json({ error: err.message });
      }

      console.log('[Cloud] Fetched', rows.length, 'betas for route', routeId);
      const betas = rows.map(row => ({
        id: row.id,
        route_id: row.route_id,
        username: row.username,
        user_name: row.user_name || row.username,
        video_url: row.video_url,
        video_local_path: row.video_local_path,
        likes: row.likes,
        created_at: row.created_at
      }));
      res.json({ success: true, betas });
    });
  } catch (error) {
    console.log('[Cloud] Get betas exception:', error.message);
    res.status(500).json({ error: error.message });
  }
};

const toggleBetaLike = async (req, res) => {
  try {
    const { betaId } = req.params;
    const { liked } = req.body;
    const change = liked ? 1 : -1;

    db.run(`UPDATE betas SET likes = likes + ? WHERE id = ?`, [change, betaId], function(err) {
      if (err) {
        console.log('[Cloud] Toggle beta like error:', err.message);
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        console.log('[Cloud] Toggle beta like failed: Beta not found:', betaId);
        return res.status(404).json({ error: 'Beta not found' });
      }

      console.log('[Cloud] Beta like toggled:', betaId, 'liked:', liked);
      res.json({ success: true, message: 'Beta like updated' });
    });
  } catch (error) {
    console.log('[Cloud] Toggle beta like exception:', error.message);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { uploadBetaVideo, getBetasForRoute, toggleBetaLike };
