const express = require('express');
const router = express.Router();
const bundleController = require('../controllers/bundle.controller');
const { asyncHandler } = require('../utils/handler');

router.post('/', asyncHandler(bundleController.bundle));
router.post('/execute', asyncHandler(bundleController.execute));

module.exports = router;