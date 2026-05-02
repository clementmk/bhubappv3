const { db } = require('../config/database');
const bcrypt = require('bcrypt');
const { generateToken } = require('../middleware/auth');

// ─── Auth ────────────────────────────────────────────────────────────────────

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      console.log('[Cloud] Register failed: Missing required fields');
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    // Derive a username from the email (part before @)
    const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');

    // Check if email already exists
    db.get('SELECT username FROM users WHERE email = ?', [email], async (err, existing) => {
      if (err) {
        console.log('[Cloud] Register error:', err.message);
        return res.status(500).json({ error: err.message });
      }
      if (existing) {
        console.log('[Cloud] Register failed: Email already registered:', email);
        return res.status(409).json({ error: 'Email already registered' });
      }

      // Hash the password before storing
      const hashedPassword = await bcrypt.hash(password, 10);

      db.run(
        `INSERT INTO users (username, name, email, password, points, highest_grade, posts, created_at, updated_at)
         VALUES (?, ?, ?, ?, 0, 'V0', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [username, name, email, hashedPassword],
        function (err) {
          if (err) {
            console.log('[Cloud] Register insert error:', err.message);
            // Handle unique constraint on username by appending a number
            if (err.message.includes('UNIQUE')) {
              return res.status(409).json({ error: 'Username or email already taken' });
            }
            return res.status(500).json({ error: err.message });
          }

          console.log('[Cloud] User registered successfully:', username);
          const token = generateToken(username);
          
          // Return the complete user object using lastID
          db.get('SELECT username, name, email, points, highest_grade, membership_type, membership_expiry FROM users WHERE username = ?', [username], (err, user) => {
            if (err) {
              console.log('[Cloud] Error fetching new user:', err.message);
              return res.status(500).json({ error: err.message });
            }
            res.status(201).json({
              success: true,
              token,
              user: { 
                ...user, 
                highestGrade: user.highest_grade,
                membershipType: user.membership_type,
                membershipExpiry: user.membership_expiry
              },
            });
          });
        }
      );
    });
  } catch (error) {
    console.log('[Cloud] Register exception:', error.message);
    res.status(500).json({ error: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('[Cloud] Login failed: Missing email or password');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, row) => {
      if (err) {
        console.log('[Cloud] Login error:', err.message);
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        console.log('[Cloud] Login failed: User not found for email:', email);
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const match = await bcrypt.compare(password, row.password);
      if (!match) {
        console.log('[Cloud] Login failed: Invalid password for email:', email);
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      console.log('[Cloud] User logged in successfully:', row.username);
      const token = generateToken(row.username);
      const { password: _pw, highest_grade, membership_type, membership_expiry, ...rest } = row;
      const safeUser = {
        ...rest,
        highestGrade: highest_grade,
        membershipType: membership_type,
        membershipExpiry: membership_expiry,
      };
      res.json({ success: true, token, user: safeUser });
    });
  } catch (error) {
    console.log('[Cloud] Login exception:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ─── Leaderboard ─────────────────────────────────────────────────────────────

const getLeaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    // Order by lowest attempts (ascending) - in climbing, fewer attempts is better
    db.all(`
      SELECT
        u.username,
        u.name,
        u.highest_grade as grade,
        u.points,
        COUNT(rc.id) as sends,
        COALESCE(MIN(rc.attempts), 0) as best_attempts
      FROM users u
      LEFT JOIN route_completions rc ON u.username = rc.username
      GROUP BY u.username
      ORDER BY sends DESC, best_attempts ASC, u.points DESC
      LIMIT ?
    `, [limit], (err, rows) => {
      if (err) {
        console.log('[Cloud] Leaderboard error:', err.message);
        return res.status(500).json({ error: err.message });
      }

      console.log('[Cloud] Leaderboard fetched:', rows.length, 'users');
      const leaderboard = rows.map((row, index) => ({
        rank: index + 1,
        username: row.username,
        name: row.name || row.username,
        sends: row.sends || 0,
        points: row.points || 0,
        grade: row.grade || 'V0',
        bestAttempts: row.best_attempts || 0,
      }));

      res.json({ success: true, leaderboard });
    });
  } catch (error) {
    console.log('[Cloud] Leaderboard exception:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ─── Profile ──────────────────────────────────────────────────────────────────

const getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;

    db.get('SELECT username, name, email, avatar, followers, following, posts, points, highest_grade, membership_type, membership_expiry, created_at FROM users WHERE username = ?', [username], (err, row) => {
      if (err) {
        console.log('[Cloud] Get profile error:', err.message);
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        console.log('[Cloud] Profile not found:', username);
        return res.status(404).json({ error: 'User not found' });
      }

      console.log('[Cloud] Profile fetched for:', username);
      const mappedUser = {
        ...row,
        highestGrade: row.highest_grade,
        membershipType: row.membership_type,
        membershipExpiry: row.membership_expiry,
      };
      res.json({ success: true, user: mappedUser });
    });
  } catch (error) {
    console.log('[Cloud] Get profile exception:', error.message);
    res.status(500).json({ error: error.message });
  }
};

const updateUserStats = async (req, res) => {
  try {
    const { username } = req.params;
    const { points, highestGrade, posts } = req.body;

    db.run(`
      UPDATE users
      SET points = ?, highest_grade = ?, posts = ?, updated_at = CURRENT_TIMESTAMP
      WHERE username = ?
    `, [points, highestGrade, posts, username], function (err) {
      if (err) {
        console.log('[Cloud] Update stats error:', err.message);
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        console.log('[Cloud] Update stats failed: User not found:', username);
        return res.status(404).json({ error: 'User not found' });
      }

      console.log('[Cloud] Stats updated for user:', username);
      res.json({ success: true, message: 'User stats updated successfully' });
    });
  } catch (error) {
    console.log('[Cloud] Update stats exception:', error.message);
    res.status(500).json({ error: error.message });
  }
};

const updateUserMembership = async (req, res) => {
  try {
    const { username } = req.params;
    const { membershipType, membershipExpiry } = req.body;

    db.run(`
      UPDATE users
      SET membership_type = ?, membership_expiry = ?, updated_at = CURRENT_TIMESTAMP
      WHERE username = ?
    `, [membershipType, membershipExpiry, username], function (err) {
      if (err) {
        console.log('[Cloud] Update membership error:', err.message);
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      console.log('[Cloud] Membership updated for user:', username);
      res.json({ success: true, message: 'Membership updated successfully' });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const syncUser = async (req, res) => {
  try {
    const userData = req.body;

    db.run(`
      INSERT OR REPLACE INTO users (username, name, email, points, highest_grade, posts, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [userData.username, userData.name, userData.email, userData.points, userData.highestGrade, userData.posts],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'User synced successfully' });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { registerUser, loginUser, getLeaderboard, getUserProfile, updateUserStats, updateUserMembership, syncUser };