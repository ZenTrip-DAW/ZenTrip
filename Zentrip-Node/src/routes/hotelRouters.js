const express = require('express');
//enrutador express
const router = express.Router();
const { searchHotelsController, getHotelDetailsController, getHotelPoliciesController, getHotelPhotosController, getChildrenPoliciesController } = require('../controllers/hotelcontrollers');

router.get('/search', searchHotelsController);
router.get('/details', getHotelDetailsController);
router.get('/policies', getHotelPoliciesController);
router.get('/photos', getHotelPhotosController);
router.get('/children-policies', getChildrenPoliciesController);

module.exports = router;
