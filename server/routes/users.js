const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getLeaderboard,
  getUserProfile,
  updateUserStats,
  updateUserMembership,
  syncUser,
} = require('../controllers/userController');
const { requireAuth } = require('../middleware/auth');

// ─── Auth (public) ────────────────────────────────────────────────────────────
router.post('/register', registerUser);
router.post('/login', loginUser);

// ─── Users ────────────────────────────────────────────────────────────────────
router.get('/leaderboard', getLeaderboard);
router.get('/:username', getUserProfile);
router.put('/:username/stats', requireAuth, updateUserStats);
router.put('/:username/membership', updateUserMembership);
router.post('/sync', requireAuth, syncUser);

module.exports = router;