const DeliveryZone = require('../models/DeliveryZone');

class ZoneController {
  async createZone(req, res, next) {
    try {
      const zone = await DeliveryZone.create(req.body);
      res.status(201).json({ success: true, data: zone });
    } catch (error) {
      next(error);
    }
  }

  async getZones(req, res, next) {
    try {
      const zones = await DeliveryZone.find({ isActive: true });
      res.json({ success: true, data: zones });
    } catch (error) {
      next(error);
    }
  }

  async checkLocation(req, res, next) {
    try {
      const { lat, lng } = req.query;
      if (!lat || !lng) return res.status(400).json({ success: false, message: 'lat,lng required' });

      const point = { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] };
      const zone = await DeliveryZone.findOne({
        isActive: true,
        polygon: {
          $geoIntersects: {
            $geometry: point
          }
        }
      });
      const available = Boolean(zone);
      res.json({ success: true, available, zone });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ZoneController();
