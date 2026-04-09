const Warehouse = require('../models/Warehouse');
const Product = require('../models/Product');

class WarehouseController {
  async createWarehouse(req, res, next) {
    try {
      const warehouse = await Warehouse.create(req.body);
      res.status(201).json({ success: true, data: warehouse });
    } catch (error) {
      next(error);
    }
  }

  async getWarehouses(req, res, next) {
    try {
      const { lat, lng, radius = 5, nearby } = req.query;
      let query = { isActive: true };

      if (nearby && lat && lng) {
        query.location = {
          $near: {
            $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
            $maxDistance: parseFloat(radius) * 1000
          }
        };
      }

      const warehouses = await Warehouse.find(query).limit(50);
      res.json({ success: true, data: warehouses });
    } catch (error) {
      next(error);
    }
  }

  async getWarehouse(req, res, next) {
    try {
      const warehouse = await Warehouse.findById(req.params.id);
      if (!warehouse) return res.status(404).json({ success: false, message: 'Warehouse not found' });
      res.json({ success: true, data: warehouse });
    } catch (error) {
      next(error);
    }
  }

  async updateWarehouse(req, res, next) {
    try {
      const warehouse = await Warehouse.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!warehouse) return res.status(404).json({ success: false, message: 'Warehouse not found' });
      res.json({ success: true, data: warehouse });
    } catch (error) {
      next(error);
    }
  }

  async getInventory(req, res, next) {
    try {
      const warehouse = await Warehouse.findById(req.params.id).populate('inventory.product');
      if (!warehouse) return res.status(404).json({ success: false, message: 'Warehouse not found' });
      res.json({ success: true, data: warehouse.inventory });
    } catch (error) {
      next(error);
    }
  }

  async warehouseWithProduct(req, res, next) {
    try {
      const { productId, lat, lng, radius = 5 } = req.query;
      if (!productId || !lat || !lng) return res.status(400).json({ success:false, message:'productId,lat,lng required' });

      const warehouses = await Warehouse.find({
        isActive: true,
        'inventory.product': productId,
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
            $maxDistance: parseFloat(radius) * 1000
          }
        }
      }).limit(10);

      res.json({ success: true, data: warehouses });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WarehouseController();
