const express = require('express');
const router = express.Router();
const { getLatestNews, getNewsByCategory, createNews } = require('../controllers/newsController');

router.get('/latest', getLatestNews);
router.get('/category/:category', getNewsByCategory);
router.post('/', createNews);

module.exports = router;
