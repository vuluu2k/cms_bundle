const express = require('express');
const bundleRouter = require('./bundle');

const router = express.Router();

router.use('/bundle', bundleRouter);

module.exports = router;