const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middlewares/authMiddleware');
const {
	sendTripInvitations,
	verifyInvitationToken,
	acceptInvitationHandler,
	claimMyInvitationsHandler,
} = require('../controllers/invitationControllers');

router.post('/send', verifyFirebaseToken, sendTripInvitations);
router.get('/verify', verifyInvitationToken);
router.post('/accept', verifyFirebaseToken, acceptInvitationHandler);
router.post('/claim-my-invitations', verifyFirebaseToken, claimMyInvitationsHandler);

module.exports = router;