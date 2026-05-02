const express = require('express');
const router = express.Router();
const { getLatestRoutes, getRouteById, submitRouteCompletion, syncRoutes,getUserSends} = require('../controllers/routeController');

router.get('/latest', getLatestRoutes);
router.get('/:id', getRouteById);
router.post('/completions', submitRouteCompletion);
router.post('/sync', syncRoutes);
router.get('/user/:username', getUserSends);

module.exports = router;
