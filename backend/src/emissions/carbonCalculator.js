/**
 * Carbon Emission Calculator
 * Calculates carbon emissions for deliveries using comprehensive two-wheeler vehicles
 * 
 * Carbon Emission Formula: emission = distance × emission_factor
 * 
 * Eco Ratings:
 * A+ → Electric vehicles (0-12 gCO₂/km)
 * A → Bicycle (0 gCO₂/km)
 * B → Hybrid vehicles (~40 gCO₂/km)
 * C → Petrol Scooters (~55 gCO₂/km)
 * D → Petrol Bikes (~75 gCO₂/km)
 * E → CNG vehicles (~95 gCO₂/km)
 */

const { 
  VEHICLE_EMISSION_FACTORS, 
  VEHICLE_AVERAGE_SPEEDS, 
  VEHICLE_DISPLAY_INFO, 
  getEcoRating 
} = require('../models/Vehicle');

// Baseline emission factor (Average Petrol Scooter) for comparison
const BASELINE_EMISSION_FACTOR = 75; // gCO₂/km

// Generic vehicle categories for simplified carbon engine tests and API
const GENERIC_VEHICLE_DATA = [
  { type: 'bicycle', emission_factor: 0 },
  { type: 'electric_bicycle', emission_factor: 5 },
  { type: 'electric_scooter', emission_factor: 8 },
  { type: 'petrol_scooter', emission_factor: 75 }
];

const GENERIC_EMISSION_FACTORS = {
  bicycle: 0,
  electric_bicycle: 5,
  electric_scooter: 8,
  petrol_scooter: 75
};

const GENERIC_VEHICLE_INFO = {
  bicycle: { brand: 'Generic', model: 'Bicycle', category: 'Bicycle', isElectric: false },
  electric_bicycle: { brand: 'Generic', model: 'E-Bike', category: 'Electric Bicycle', isElectric: true },
  electric_scooter: { brand: 'Generic', model: 'E-Scooter', category: 'Electric Scooter', isElectric: true },
  petrol_scooter: { brand: 'Generic', model: 'Petrol Scooter', category: 'Petrol Scooter', isElectric: false }
};

/**
 * Get vehicle display info
 */
const getVehicleInfo = (vehicleType) => {
  if (GENERIC_VEHICLE_INFO[vehicleType]) {
    return GENERIC_VEHICLE_INFO[vehicleType];
  }

  return VEHICLE_DISPLAY_INFO[vehicleType] || {
    brand: 'Unknown',
    model: 'Unknown',
    category: 'Unknown',
    isElectric: false
  };
};

/**
 * Calculate carbon emission for a delivery
 * @param {number} distance - Distance in kilometers
 * @param {string} vehicleType - Type of vehicle
 * @returns {object} - Emission data
 */
const calculateEmission = (distance, vehicleType) => {
  let type = vehicleType;
  let admissionFactor;

  if (typeof vehicleType === 'object' && vehicleType !== null) {
    type = vehicleType.type || vehicleType.vehicleType;
    admissionFactor = vehicleType.emission_factor ?? vehicleType.emissionFactor;
  }

  if (!type) {
    type = 'petrol_scooter';
  }

  const emissionFactor = admissionFactor ?? GENERIC_EMISSION_FACTORS[type] ?? VEHICLE_EMISSION_FACTORS[type] ?? BASELINE_EMISSION_FACTOR;
  const emission = distance * emissionFactor;

  const baselineEmission = Math.abs(distance) * BASELINE_EMISSION_FACTOR;
  const savings = baselineEmission - emission;

  const vehicleInfo = getVehicleInfo(type);
  const ecoRating = getEcoRating(type);

  return {
    distance: distance,
    type: type,
    vehicleType: type,
    brand: vehicleInfo.brand,
    model: vehicleInfo.model,
    category: vehicleInfo.category,
    isElectric: vehicleInfo.isElectric,
    emissionFactor: emissionFactor,
    emission: Math.round(emission * 100) / 100,
    savings: Math.round(savings * 100) / 100,
    carbonEmission: Math.round(emission * 100) / 100,
    baselineEmission: Math.round(baselineEmission * 100) / 100,
    carbonSaved: Math.round(savings * 100) / 100,
    ecoRating: ecoRating,
    isEcoFriendly: ecoRating === 'A+' || ecoRating === 'A'
  };
};

/**
 * Calculate emission using vehicle object
 */
const calculateEmissionForVehicle = (distance, vehicle) => {
  const vehicleType = vehicle.type || vehicle.vehicleType;
  return calculateEmission(distance, vehicleType);
};

/**
 * Select the best vehicle based on delivery requirements
 * @param {Array} vehicles - Array of available vehicles
 * @param {number} distance - Distance in kilometers
 * @param {string} mode - 'eco', 'fast', or 'balanced'
 * @returns {object} - Best vehicle for the delivery
 */
const selectBestVehicle = (vehicles, distance, mode = 'eco') => {
  if (!vehicles || vehicles.length === 0) {
    return {
      type: 'electric_bicycle',
      brand: 'Generic',
      model: 'E-Bike',
      emission_factor: 5,
      average_speed: 25,
      ecoRating: 'A+'
    };
  }
  
  const availableVehicles = vehicles.filter(v => 
    v.isActive !== false && v.isAvailable !== false
  );
  
  if (availableVehicles.length === 0) {
    return {
      type: 'electric_bicycle',
      brand: 'Generic',
      model: 'E-Bike',
      emission_factor: 5,
      average_speed: 25,
      ecoRating: 'A+'
    };
  }
  
  const scoredVehicles = availableVehicles.map(v => {
    const vehicleType = v.type || v.vehicleType;
    const emissionFactor = VEHICLE_EMISSION_FACTORS[vehicleType] || 75;
    const averageSpeed = VEHICLE_AVERAGE_SPEEDS[vehicleType] || 50;
    const ecoRating = getEcoRating(vehicleType);
    
    let score = 0;
    
    if (mode === 'eco') {
      score = 1000 - emissionFactor * 10;
    } else if (mode === 'fast') {
      score = averageSpeed * 10;
    } else {
      score = (1000 - emissionFactor * 5) + (averageSpeed * 5);
    }
    
    return {
      ...v,
      vehicleType,
      emissionFactor,
      averageSpeed,
      ecoRating,
      score
    };
  });
  
  scoredVehicles.sort((a, b) => b.score - a.score);
  
  const best = scoredVehicles[0];
  return {
    type: best.vehicleType,
    brand: VEHICLE_DISPLAY_INFO[best.vehicleType]?.brand || 'Unknown',
    model: VEHICLE_DISPLAY_INFO[best.vehicleType]?.model || 'Unknown',
    emission_factor: best.emissionFactor,
    average_speed: best.averageSpeed,
    ecoRating: best.ecoRating,
    score: best.score
  };
};

/**
 * Get emission comparison for all vehicle types at a distance
 */
const getVehicleComparison = (distance) => {
  return GENERIC_VEHICLE_DATA.map(vehicle => calculateEmission(distance, vehicle.type))
    .sort((a, b) => a.emissionFactor - b.emissionFactor);
};

/**
 * Get comparison for specific categories
 */
const getCategoryComparison = (distance) => {
  return {
    electricScooters: getVehiclesByCategory('Electric Scooter', distance),
    electricBikes: getVehiclesByCategory('Electric Bike', distance),
    bicycles: getVehiclesByCategory('Bicycle', distance),
    petrolScooters: getVehiclesByCategory('Petrol Scooter', distance),
    petrolBikes: getVehiclesByCategory('Petrol Bike', distance)
  };
};

const getVehiclesByCategory = (category, distance) => {
  return Object.keys(VEHICLE_DISPLAY_INFO)
    .filter(type => VEHICLE_DISPLAY_INFO[type].category === category)
    .map(type => calculateEmission(distance, type));
};

/**
 * Calculate total carbon for multiple deliveries
 */
const calculateTotalCarbon = (orders) => {
  let totalEmission = 0;
  let totalSavings = 0;
  let totalDistance = 0;
  let ecoDeliveries = 0;
  let totalDeliveries = orders.length;

  for (const order of orders) {
    let emissionValue;
    let savingsValue;
    let distance;
    let isEco = false;

    if (order.emissionData) {
      emissionValue = order.emissionData.actualEmission ?? order.emissionData.carbonEmission ?? 0;
      savingsValue = order.emissionData.carbonSaved ?? 0;
      distance = order.emissionData.distanceKm ?? order.emissionData.distance ?? order.distance ?? 0;
      isEco = order.emissionData.isEcoFriendly ?? order.emissionData.isEco === true;
    } else if (order.carbonEmitted !== undefined) {
      emissionValue = order.carbonEmitted;
      savingsValue = order.carbonSaved ?? 0;
      distance = order.distance ?? order.distanceKm ?? 0;
      isEco = order.isEcoFriendly ?? false;
    } else {
      const vehicleType = order.vehicleType || order.vehicle || 'petrol_scooter';
      distance = order.distance || order.distanceKm || 0;
      const emission = calculateEmission(distance, vehicleType);
      emissionValue = emission.carbonEmission;
      savingsValue = emission.carbonSaved;
      isEco = emission.isEcoFriendly;
    }

    totalEmission += emissionValue;
    totalSavings += savingsValue;
    totalDistance += distance;
    if (isEco) ecoDeliveries++;
  }

  return {
    totalEmission: Math.round(totalEmission * 100) / 100,
    totalSavings: Math.round(totalSavings * 100) / 100,
    totalDistance: Math.round(totalDistance * 100) / 100,
    averageEmissionPerDelivery: totalDeliveries > 0 
      ? Math.round((totalEmission / totalDeliveries) * 100) / 100 
      : 0,
    ecoDeliveryPercentage: totalDeliveries > 0 
      ? Math.round((ecoDeliveries / totalDeliveries) * 100) 
      : 0
  };
};

/**
 * Calculate eco-score based on carbon savings
 */
const calculateEcoScore = (carbonSaved) => {
  const score = Math.min(100, Math.floor(carbonSaved / 1000));
  return score;
};

/**
 * Get eco-score level
 */
const getEcoScoreLevel = (score) => {
  if (score >= 90) return '🌟 Eco Champion';
  if (score >= 70) return '🌱 Green Leader';
  if (score >= 50) return '🍃 Eco Warrior';
  if (score >= 30) return '🌿 Eco Starter';
  return '🌱 Newcomer';
};

/**
 * Get emission factors
 */
const getEmissionFactors = () => ({
  bicycle: 0,
  electric_bicycle: 5,
  electric_scooter: 8,
  petrol_scooter: 75,
  baseline: BASELINE_EMISSION_FACTOR
});

/**
 * Get all vehicle types
 */
const getVehicleTypes = () => GENERIC_VEHICLE_DATA;

/**
 * Validate if vehicle is allowed for GreenRoute deliveries
 */
const isVehicleAllowed = (vehicleType) => {
  const ecoRating = getEcoRating(vehicleType);
  return ecoRating === 'A+' || ecoRating === 'A' || ecoRating === 'B';
};

/**
 * Get eco-friendly vehicles only
 */
const getEcoFriendlyVehicles = () => {
  return Object.keys(VEHICLE_DISPLAY_INFO)
    .filter(type => {
      const rating = getEcoRating(type);
      return rating === 'A+' || rating === 'A';
    })
    .map(type => calculateEmission(1, type));
};

module.exports = {
  calculateEmission,
  calculateEmissionForVehicle,
  selectBestVehicle,
  getVehicleComparison,
  getCategoryComparison,
  calculateTotalCarbon,
  calculateEcoScore,
  getEcoScoreLevel,
  isVehicleAllowed,
  getEcoFriendlyVehicles,
  getVehicleInfo,
  getEmissionFactors,
  getVehicleTypes,
  BASELINE_EMISSION_FACTOR
};
