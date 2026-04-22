const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middlewares/authMiddleware');
const { getTripMembers, getUserTrips, addHotelBookingToTrip, deleteCloudinaryImage } = require('../controllers/tripControllers');

router.get('/my-trips', verifyFirebaseToken, getUserTrips);
router.get('/:tripId/members', verifyFirebaseToken, getTripMembers);
router.post('/:tripId/bookings/hotels', verifyFirebaseToken, addHotelBookingToTrip);
router.delete('/gallery/image', verifyFirebaseToken, deleteCloudinaryImage);

module.exports = router;
