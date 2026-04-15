const express = require('express');

const router = express.Router();
const {
	searchFlightDestinationsController,
	searchFlightsController,
	searchFlightsMultiStopsController,
	getFlightDetailsController,
	getMinPriceController,
	getMinPriceMultiStopsController,
	getSeatMapController,
} = require('../controllers/flightControllers');

router.get('/destinations', searchFlightDestinationsController);
router.get('/search', searchFlightsController);
router.get('/search-multi-stops', searchFlightsMultiStopsController);
router.get('/details', getFlightDetailsController);
router.get('/min-price', getMinPriceController);
router.get('/min-price-multi-stops', getMinPriceMultiStopsController);
router.get('/seat-map', getSeatMapController);

module.exports = router;
