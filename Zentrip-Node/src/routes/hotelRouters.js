const express = require('express');
//enrutador express
const router = express.Router();
const { searchHotelsController, getHotelDetailsController, getHotelPoliciesController } = require('../controllers/hotelcontrollers');

router.get('/search', searchHotelsController);
router.get('/details', getHotelDetailsController);
router.get('/policies', getHotelPoliciesController);

module.exports = router;
