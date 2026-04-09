const express = require('express');
const router = express.Router();
const zoneController = require('../controllers/zone.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize');

router.get('/', zoneController.getZones);
router.get('/check', zoneController.checkLocation);
router.post('/', authenticate, authorize('admin'), zoneController.createZone);

module.exports = router;
