const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middlewares/authMiddleware');
const { getProtectedData, createUserAdmin, searchUsers } = require('../controllers/userControllers');

router.get('/protected-data', verifyFirebaseToken, getProtectedData);
router.post('/create-user-admin', createUserAdmin);
router.get('/search-users', searchUsers);

module.exports = router;
