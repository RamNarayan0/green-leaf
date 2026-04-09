/**
 * Emission Routes
 * Handles carbon emission calculation and reporting endpoints
 */ 

const express = require('express');
const router = express.Router();
const carbonCalculator = require('../emissions/carbonCalculator');
const { authenticate } = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize');

// Calculate emissions for a delivery
router.post('/calculate', (req, res) => {
  try {
    // Accept both distance and distanceKm from frontend
    const { distance, distanceKm, vehicleType } = req.body;
    const distanceValue = distance || distanceKm || 0;
    
    // Get vehicle object from type string
    const vehicles = carbonCalculator.getVehicleTypes();
    let vehicle;
    if (typeof vehicleType === 'string') {
      vehicle = vehicles.find(v => v.type === vehicleType) || { type: vehicleType, emission_factor: 75 };
    } else {
      vehicle = vehicleType || { type: 'unknown', emission_factor: 75 };
    }
    
    const result = carbonCalculator.calculateEmission(distanceValue, vehicle);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }                                                                     
});

// Compare emissions across vehicle types
router.post('/compare', (req, res) => {
  try {
    // Accept both distance and distanceKm from frontend
    const { distance, distanceKm } = req.body;
    const distanceValue = distance || distanceKm || 0;
    const result = carbonCalculator.compareVehicles(distanceValue);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get available vehicle types
router.get('/vehicles', (req, res) => {
  res.json({ success: true, data: carbonCalculator.getVehicleTypes() });
});

// Get emission factors
router.get('/factors', (req, res) => {
  res.json({ success: true, data: carbonCalculator.getEmissionFactors() });
});

// Admin: Get city-wide emission stats
router.get('/city-stats', authenticate, authorize('admin'), (req, res) => {
  try {
    // This would aggregate from Order model
    const stats = {
      totalDistance: 0,
      totalEmissions: 0,
      emissionsSaved: 0,
      vehicleBreakdown: {}
    };
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}); 

module.exports = router;
