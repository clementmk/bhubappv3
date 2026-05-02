const { db } = require('../config/database');

// Get latest news articles
const getLatestNews = async (req, res) => {
  try {
    db.all(`
      SELECT id, title, subtitle, content, image_uri, category, created_at
      FROM news
      WHERE published = 1
      ORDER BY created_at DESC
      LIMIT 20
    `, [], (err, rows) => {
      if (err) {
        console.log('[Cloud] Get latest news error:', err.message);
        return res.status(500).json({ error: err.message });
      }

      console.log('[Cloud] Fetched', rows.length, 'news articles');
      res.json({ success: true, news: rows });
    });
  } catch (error) {
    console.log('[Cloud] Get latest news exception:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Get news by category
const getNewsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    db.all(`
      SELECT id, title, subtitle, content, image_uri, category, created_at
      FROM news
      WHERE category = ? AND published = 1
      ORDER BY created_at DESC
      LIMIT 20
    `, [category], (err, rows) => {
      if (err) {
        console.log('[Cloud] Get news by category error:', err.message);
        return res.status(500).json({ error: err.message });
      }

      console.log('[Cloud] Fetched', rows.length, 'news articles for category:', category);
      res.json({ success: true, news: rows });
    });
  } catch (error) {
    console.log('[Cloud] Get news by category exception:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Create a news article (admin use)
const createNews = async (req, res) => {
  try {
    const { title, subtitle, content, imageUri, category } = req.body;

    if (!title || !content) {
      console.log('[Cloud] Create news failed: Missing required fields');
      return res.status(400).json({ error: 'title and content are required' });
    }

    db.run(`
      INSERT INTO news (title, subtitle, content, image_uri, category)
      VALUES (?, ?, ?, ?, ?)
    `, [title, subtitle, content, imageUri, category || 'general'], function(err) {
      if (err) {
        console.log('[Cloud] Create news insert error:', err.message);
        return res.status(500).json({ error: err.message });
      }

      const newsId = this.lastID;
      console.log('[Cloud] News article created:', newsId, '-', title);

      res.status(201).json({
        success: true,
        id: newsId,
        title,
        subtitle,
        content,
        image_uri: imageUri,
        category: category || 'general',
        published: 1,
      });
    });
  } catch (error) {
    console.log('[Cloud] Create news exception:', error.message);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getLatestNews, getNewsByCategory, createNews };
