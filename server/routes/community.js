const express = require('express');
const router = express.Router();
const { getPosts, createPost, togglePostLike } = require('../controllers/communityController');

router.get('/posts', getPosts);
router.post('/posts', createPost);
router.post('/posts/:postId/like', togglePostLike);

module.exports = router;
