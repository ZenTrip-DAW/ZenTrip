const express = require('express');
const router = express.Router();
const { searchCarLocationController, searchCarRentalsController, getVehicleDetailsController } = require('../controllers/carControllers');

router.get('/location', searchCarLocationController);
router.get('/search', searchCarRentalsController);
router.get('/details', getVehicleDetailsController);

module.exports = router;
