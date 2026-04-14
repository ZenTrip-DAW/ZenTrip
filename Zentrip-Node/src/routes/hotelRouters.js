const express = require('express');
//enrutador express
const router = express.Router();
const { searchHotelsController, getHotelDetailsController } = require('../controllers/hotelcontrollers');

router.get('/search', searchHotelsController);
router.get('/details', getHotelDetailsController);

module.exports = router;
