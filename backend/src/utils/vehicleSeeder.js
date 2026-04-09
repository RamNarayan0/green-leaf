/**
 * Vehicle Seeder
 * Seeds the database with comprehensive two-wheeler vehicles
 */

const Vehicle = require('../models/Vehicle');
const { 
  VEHICLE_EMISSION_FACTORS, 
  VEHICLE_AVERAGE_SPEEDS,
  VEHICLE_MAX_WEIGHTS,
  VEHICLE_OPERATING_COSTS,
  VEHICLE_DISPLAY_INFO
} = require('../models/Vehicle');

/**
 * Seed all vehicles into database
 */
const seedVehicles = async () => {
  try {
    console.log('🚀 Starting vehicle seeding...');
    
    // Get all vehicle types
    const vehicleTypes = Object.keys(VEHICLE_EMISSION_FACTORS);
    
    let seededCount = 0;
    let skippedCount = 0;
    
    for (const type of vehicleTypes) {
      // Check if vehicle type already exists
      const existing = await Vehicle.findOne({ vehicleType: type });
      
      if (existing) {
        skippedCount++;
        console.log(`  ⏭️  Skipped: ${VEHICLE_DISPLAY_INFO[type]?.brand} ${VEHICLE_DISPLAY_INFO[type]?.model}`);
        continue;
      }
      
      const vehicleInfo = VEHICLE_DISPLAY_INFO[type];
      
      const vehicle = new Vehicle({
        vehicleType: type,
        licenseNumber: `VEH-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        vehicleNumber: `XX-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        owner: null, // Will be assigned when delivery partner registers
        make: vehicleInfo?.brand || 'Unknown',
        model: vehicleInfo?.model || 'Unknown',
        year: 2024,
        capacity: VEHICLE_MAX_WEIGHTS[type] || 50,
        isActive: true,
        isVerified: true, // Default vehicles are verified
        isAvailable: true,
        insuranceExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        registrationExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        stats: {
          totalDeliveries: 0,
          totalDistance: 0,
          totalEmissions: 0,
          totalEarnings: 0
        },
        carbonSaved: 0,
        ecoScore: 0
      });
      
      await vehicle.save();
      seededCount++;
      console.log(`  ✅ Seeded: ${vehicleInfo?.brand} ${vehicleInfo?.model} (${VEHICLE_EMISSION_FACTORS[type]} gCO₂/km)`);
    }
    
    console.log(`\n📊 Vehicle seeding complete!`);
    console.log(`   Seeded: ${seededCount} vehicles`);
    console.log(`   Skipped: ${skippedCount} vehicles (already exist)`);
    
    return { seededCount, skippedCount };
  } catch (error) {
    console.error('❌ Error seeding vehicles:', error);
    throw error;
  }
};

/**
 * Get vehicle statistics
 */
const getVehicleStats = async () => {
  const vehicleTypes = Object.keys(VEHICLE_EMISSION_FACTORS);
  
  const stats = {
    totalTypes: vehicleTypes.length,
    byCategory: {
      electricScooters: 0,
      electricBikes: 0,
      bicycles: 0,
      petrolScooters: 0,
      petrolBikes: 0,
      cng: 0,
      hybrid: 0
    },
    byBrand: {},
    ecoFriendly: 0,
    averageEmission: 0
  };
  
  let totalEmission = 0;
  
  for (const type of vehicleTypes) {
    const info = VEHICLE_DISPLAY_INFO[type];
    const emission = VEHICLE_EMISSION_FACTORS[type];
    
    // Count by category
    switch (info?.category) {
      case 'Electric Scooter':
        stats.byCategory.electricScooters++;
        break;
      case 'Electric Bike':
        stats.byCategory.electricBikes++;
        break;
      case 'Bicycle':
        stats.byCategory.bicycles++;
        break;
      case 'Petrol Scooter':
        stats.byCategory.petrolScooters++;
        break;
      case 'Petrol Bike':
        stats.byCategory.petrolBikes++;
        break;
      case 'CNG Scooter':
        stats.byCategory.cng++;
        break;
      case 'Hybrid Scooter':
        stats.byCategory.hybrid++;
        break;
    }
    
    // Count by brand
    const brand = info?.brand || 'Unknown';
    stats.byBrand[brand] = (stats.byBrand[brand] || 0) + 1;
    
    // Count eco-friendly (emission < 20)
    if (emission < 20) {
      stats.ecoFriendly++;
    }
    
    totalEmission += emission;
  }
  
  stats.averageEmission = Math.round(totalEmission / vehicleTypes.length);
  
  return stats;
};

/**
 * Display all vehicles by category
 */
const displayVehiclesByCategory = () => {
  const categories = {};
  
  Object.keys(VEHICLE_DISPLAY_INFO).forEach(type => {
    const info = VEHICLE_DISPLAY_INFO[type];
    const category = info?.category || 'Other';
    
    if (!categories[category]) {
      categories[category] = [];
    }
    
    categories[category].push({
      type,
      brand: info?.brand,
      model: info?.model,
      emission: VEHICLE_EMISSION_FACTORS[type],
      speed: VEHICLE_AVERAGE_SPEEDS[type]
    });
  });
  
  console.log('\n📱 VEHICLES BY CATEGORY:\n');
  
  Object.keys(categories).forEach(category => {
    console.log(`\n🚗 ${category}:`);
    categories[category].forEach(v => {
      console.log(`   • ${v.brand} ${v.model} (${v.emission} gCO₂/km)`);
    });
  });
};

/**
 * Display eco-friendly leaderboard
 */
const displayEcoLeaderboard = () => {
  const vehicles = Object.keys(VEHICLE_EMISSION_FACTORS)
    .map(type => ({
      type,
      ...VEHICLE_DISPLAY_INFO[type],
      emission: VEHICLE_EMISSION_FACTORS[type]
    }))
    .sort((a, b) => a.emission - b.emission);
  
  console.log('\n🌱 ECO-FRIENDLY LEADERBOARD:\n');
  
  vehicles.forEach((v, idx) => {
    const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '  ';
    console.log(`${medal} ${idx + 1}. ${v.brand} ${v.model} - ${v.emission} gCO₂/km`);
  });
};

module.exports = {
  seedVehicles,
  getVehicleStats,
  displayVehiclesByCategory,
  displayEcoLeaderboard
};
