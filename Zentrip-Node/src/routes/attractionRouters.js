const express = require('express');
const router = express.Router();
const { searchAttractionsController, getAttractionDetailsController } = require('../controllers/attractionControllers');

router.get('/search', searchAttractionsController);
router.get('/details', getAttractionDetailsController);

module.exports = router;
