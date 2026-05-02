const { db } = require('../config/database');

const getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    db.all(`
      SELECT cp.id, cp.username, cp.content, cp.type, cp.image_uri, cp.video_uri, cp.likes, cp.comments, cp.shares, cp.timestamp, cp.created_at,
             u.name as user_name, u.avatar as user_avatar
      FROM community_posts cp
      LEFT JOIN users u ON cp.username = u.username
      ORDER BY cp.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset], (err, rows) => {
      if (err) {
        console.log('[Cloud] Get posts error:', err.message);
        return res.status(500).json({ error: err.message });
      }

      console.log('[Cloud] Fetched', rows.length, 'posts');
      const posts = rows.map(row => ({
        id: row.id.toString(),
        user: {
          name: row.user_name || row.username,
          username: row.username,
          avatar: row.user_avatar,
        },
        content: row.content,
        type: row.type,
        image_uri: row.image_uri,
        video_uri: row.video_uri,
        likes: row.likes,
        comments: row.comments,
        shares: row.shares,
        timestamp: row.timestamp || row.created_at,
      }));

      res.json({ success: true, posts });
    });
  } catch (error) {
    console.log('[Cloud] Get posts exception:', error.message);
    res.status(500).json({ error: error.message });
  }
};

const createPost = async (req, res) => {
  try {
    const { username, content, type, imageUri, videoUri } = req.body;

    if (!username || !content) {
      console.log('[Cloud] Create post failed: Missing required fields');
      return res.status(400).json({ error: 'username and content are required' });
    }

    // Validate user exists before creating post
    db.get('SELECT username FROM users WHERE username = ?', [username], (err, user) => {
      if (err) {
        console.log('[Cloud] Create post error (user check):', err.message);
        return res.status(500).json({ error: err.message });
      }
      if (!user) {
        console.log('[Cloud] Create post failed: User not found:', username);
        return res.status(400).json({ error: 'User does not exist' });
      }

      db.run(`
        INSERT INTO community_posts (username, content, type, image_uri, video_uri, timestamp, created_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [username, content, type || 'text', imageUri, videoUri], function(err) {
        if (err) {
          console.log('[Cloud] Create post insert error:', err.message);
          return res.status(500).json({ error: err.message });
        }

        const newPostId = this.lastID;
        console.log('[Cloud] New post created:', newPostId, 'by', username);

        const newPost = {
          id: newPostId.toString(),
          user: { name: username, username, avatar: null },
          content,
          type: type || 'text',
          image_uri: imageUri,
          video_uri: videoUri,
          likes: 0,
          comments: 0,
          shares: 0,
          timestamp: new Date().toISOString(),
        };

        const io = req.app.get('io');
        io.emit('post_created', newPost);

        res.status(201).json({ success: true, post: newPost });
      });
    });
  } catch (error) {
    console.log('[Cloud] Create post exception:', error.message);
    res.status(500).json({ error: error.message });
  }
};

const togglePostLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const { liked } = req.body;
    const change = liked ? 1 : -1;

    db.run(`
      UPDATE community_posts SET likes = likes + ? WHERE id = ?
    `, [change, postId], function(err) {
      if (err) {
        console.log('[Cloud] Toggle like error:', err.message);
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        console.log('[Cloud] Toggle like failed: Post not found:', postId);
        return res.status(404).json({ error: 'Post not found' });
      }

      console.log('[Cloud] Post like toggled:', postId, 'liked:', liked);
      res.json({ success: true, message: 'Post like updated' });
    });
  } catch (error) {
    console.log('[Cloud] Toggle like exception:', error.message);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getPosts, createPost, togglePostLike };
