const express = require('express');
const router = express.Router();
const { searchRestaurantsController, getRestaurantDetailsController } = require('../controllers/restaurantControllers');

router.get('/search', searchRestaurantsController);
router.get('/details', getRestaurantDetailsController);

module.exports = router;
