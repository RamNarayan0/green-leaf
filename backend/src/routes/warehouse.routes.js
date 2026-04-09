const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouse.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize');

router.get('/', warehouseController.getWarehouses);
router.get('/nearby', warehouseController.getWarehouses);
router.get('/product', warehouseController.warehouseWithProduct);
router.get('/:id', warehouseController.getWarehouse);

router.post('/', authenticate, authorize('admin', 'shopkeeper'), warehouseController.createWarehouse);
router.put('/:id', authenticate, authorize('admin', 'shopkeeper'), warehouseController.updateWarehouse);
router.get('/:id/inventory', authenticate, authorize('admin', 'shopkeeper'), warehouseController.getInventory);

module.exports = router;
