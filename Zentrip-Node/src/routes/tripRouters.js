const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middlewares/authMiddleware');
const { getTripMembers } = require('../controllers/tripControllers');

router.get('/:tripId/members', verifyFirebaseToken, getTripMembers);

module.exports = router;
