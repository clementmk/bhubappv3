const express = require('express');
const router = express.Router();
const { syncChanges, getCloudData } = require('../controllers/syncController');

router.post('/changes', syncChanges);
router.get('/pull', getCloudData);

module.exports = router;
