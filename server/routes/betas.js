const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads/betas');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

const { uploadBetaVideo, getBetasForRoute, toggleBetaLike } = require('../controllers/betaController');

router.post('/upload', upload.single('video'), uploadBetaVideo);
router.get('/route/:routeId', getBetasForRoute);
router.post('/:betaId/like', toggleBetaLike);

module.exports = router;
