/**
 * Vehicle Routes
 * API endpoints for vehicle management and carbon calculations
 */

const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const carbonCalculator = require('../emissions/carbonCalculator');
const routeOptimizer = require('../services/routeOptimizer');
const { getEcoRating } = require('../models/Vehicle');

// GET /api/vehicles - Get all vehicle types
router.get('/', async (req, res) => {
  try {
    const { category, brand, ecoRating, isElectric } = req.query;
    
    let vehicles = Vehicle.getAllVehicleTypes();
    
    if (category) {
      vehicles = vehicles.filter(v => v.category === category);
    }
    
    if (brand) {
      vehicles = vehicles.filter(v => v.brand === brand);
    }
    
    if (ecoRating) {
      vehicles = vehicles.filter(v => v.ecoRating === ecoRating);
    }
    
    if (isElectric !== undefined) {
      vehicles = vehicles.filter(v => v.isElectric === (isElectric === 'true'));
    }
    
    res.json({
      success: true,
      count: vehicles.length,
      data: vehicles
    });
  } catch (error) {
    console.error('Error getting vehicles:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vehicles',
      error: error.message
    });
  }
});

// GET /api/vehicles/categories - Get vehicle categories
router.get('/categories', async (req, res) => {
  try {
    const vehicles = Vehicle.getAllVehicleTypes();
    const categories = {};
    
    vehicles.forEach(v => {
      if (!categories[v.category]) {
        categories[v.category] = {
          name: v.category,
          count: 0,
          vehicles: [],
          averageEmission: 0,
          ecoRatings: {}
        };
      }
      categories[v.category].count++;
      categories[v.category].vehicles.push({
        type: v.type,
        brand: v.brand,
        model: v.model,
        emissionFactor: v.emissionFactor,
        ecoRating: v.ecoRating
      });
      categories[v.category].ecoRatings[v.ecoRating] = 
        (categories[v.category].ecoRatings[v.ecoRating] || 0) + 1;
    });
    
    Object.keys(categories).forEach(cat => {
      const totalEmission = categories[cat].vehicles.reduce((sum, v) => sum + v.emissionFactor, 0);
      categories[cat].averageEmission = Math.round(totalEmission / categories[cat].count);
    });
    
    res.json({
      success: true,
      data: Object.values(categories)
    });
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
});

// GET /api/vehicles/brands - Get all brands
router.get('/brands', async (req, res) => {
  try {
    const brands = Vehicle.getAllBrands();
    const brandDetails = [];
    
    brands.forEach(brand => {
      const vehicles = Vehicle.getVehiclesByBrand(brand);
      const ecoVehicles = vehicles.filter(v => v.ecoRating === 'A+' || v.ecoRating === 'A');
      
      brandDetails.push({
        name: brand,
        totalVehicles: vehicles.length,
        ecoFriendlyCount: ecoVehicles.length,
        vehicles: vehicles.map(v => ({
          type: v.type,
          model: v.model,
          category: v.category,
          emissionFactor: v.emissionFactor,
          ecoRating: v.ecoRating
        }))
      });
    });
    
    res.json({
      success: true,
      count: brands.length,
      data: brandDetails
    });
  } catch (error) {
    console.error('Error getting brands:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching brands',
      error: error.message
    });
  }
});

// GET /api/vehicles/eco-friendly - Get eco-friendly vehicles
router.get('/eco-friendly', async (req, res) => {
  try {
    const vehicles = Vehicle.getEcoFriendlyVehicles();
    
    res.json({
      success: true,
      count: vehicles.length,
      data: vehicles
    });
  } catch (error) {
    console.error('Error getting eco-friendly vehicles:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching eco-friendly vehicles',
      error: error.message
    });
  }
});

// GET /api/vehicles/:type - Get specific vehicle type
router.get('/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const vehicles = Vehicle.getAllVehicleTypes();
    const vehicle = vehicles.find(v => v.type === type);
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle type not found'
      });
    }
    
    res.json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    console.error('Error getting vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vehicle',
      error: error.message
    });
  }
});

// GET /api/vehicles/emission/calculate - Calculate emission
router.get('/emission/calculate', async (req, res) => {
  try {
    const { distance, vehicleType, mode } = req.query;
    
    if (!distance || !vehicleType) {
      return res.status(400).json({
        success: false,
        message: 'Distance and vehicleType are required'
      });
    }
    
    const emission = carbonCalculator.calculateEmission(parseFloat(distance), vehicleType);
    const comparison = carbonCalculator.getVehicleComparison(parseFloat(distance));
    
    res.json({
      success: true,
      data: {
        emission,
        comparison,
        mode: mode || 'eco'
      }
    });
  } catch (error) {
    console.error('Error calculating emission:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating emission',
      error: error.message
    });
  }
});

// GET /api/vehicles/route/optimize - Optimize route
router.get('/route/optimize', async (req, res) => {
  try {
    const { 
      shopLat, shopLng, 
      customerLat, customerLng,
      mode,
      vehicles 
    } = req.query;
    
    if (!shopLat || !shopLng || !customerLat || !customerLng) {
      return res.status(400).json({
        success: false,
        message: 'Shop and customer coordinates are required'
      });
    }
    
    const shopLocation = [parseFloat(shopLng), parseFloat(shopLat)];
    const customerLocation = [parseFloat(customerLng), parseFloat(customerLat)];
    
    const availableVehicles = vehicles ? JSON.parse(vehicles) : [];
    
    const optimizedRoute = await routeOptimizer.findOptimalRoute({
      shopLocation,
      customerLocation,
      availableVehicles,
      mode: mode || 'eco'
    });
    
    const vehicleComparison = routeOptimizer.compareVehicleRoutes(optimizedRoute.distance);
    
    res.json({
      success: true,
      data: {
        route: optimizedRoute,
        vehicleComparison
      }
    });
  } catch (error) {
    console.error('Error optimizing route:', error);
    res.status(500).json({
      success: false,
      message: 'Error optimizing route',
      error: error.message
    });
  }
});

// POST /api/vehicles/select-vehicle - Select best vehicle
router.post('/select-vehicle', async (req, res) => {
  try {
    const { distance, availableVehicles, mode, weight } = req.body;
    
    if (!distance) {
      return res.status(400).json({
        success: false,
        message: 'Distance is required'
      });
    }
    
    let vehicles = availableVehicles || [];
    if (weight) {
      vehicles = vehicles.filter(v => v.capacity >= weight);
    }
    
    const selectedVehicle = carbonCalculator.selectBestVehicle(vehicles, distance, mode || 'eco');
    const emission = carbonCalculator.calculateEmission(distance, selectedVehicle.type);
    
    res.json({
      success: true,
      data: {
        vehicle: selectedVehicle,
        emission,
        distance,
        mode: mode || 'eco'
      }
    });
  } catch (error) {
    console.error('Error selecting vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Error selecting vehicle',
      error: error.message
    });
  }
});

// GET /api/vehicles/stats/summary - Get statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const vehicles = Vehicle.getAllVehicleTypes();
    
    const stats = {
      totalVehicles: vehicles.length,
      byEcoRating: {},
      byCategory: {},
      byBrand: {},
      electricVehicles: 0,
      averageEmission: 0
    };
    
    let totalEmission = 0;
    
    vehicles.forEach(v => {
      stats.byEcoRating[v.ecoRating] = (stats.byEcoRating[v.ecoRating] || 0) + 1;
      stats.byCategory[v.category] = (stats.byCategory[v.category] || 0) + 1;
      stats.byBrand[v.brand] = (stats.byBrand[v.brand] || 0) + 1;
      if (v.isElectric) stats.electricVehicles++;
      totalEmission += v.emissionFactor;
    });
    
    stats.averageEmission = Math.round(totalEmission / vehicles.length);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

module.exports = router;
