/**
 * Vehicle Model - Two-Wheeler Fleet
 * 
 * Represents vehicles available for delivery in the GreenRoute platform
 * Comprehensive two-wheeler vehicles from different brands with emission factors
 * 
 * Carbon Emission = Distance × Emission Factor
 */

const mongoose = require('mongoose');

// ============================================
// COMPREHENSIVE TWO-WHEELER VEHICLE DATABASE
// ============================================

// Vehicle emission factors (gCO2 per km) - Only TWO-WHEELERS
const VEHICLE_EMISSION_FACTORS = {
  // Electric Bicycles
  'electric_bicycle_hero': 0,
  'electric_bicycle_lectro': 0,
  'electric_bicycle_btwin': 0,
  'electric_bicycle_mez': 0,
  
  // Regular Bicycles
  'bicycle_hero': 0,
  'bicycle_standard': 0,
  'bicycle_road': 0,
  'bicycle_mountain': 0,
  
  // Electric Scooters - A+ Rating (Best Eco)
  'electric_scooter_ather_450x': 8,
  'electric_scooter_ather_450s': 8,
  'electric_scooter_ather_400': 8,
  'electric_scooter_tvs_iqube': 8,
  'electric_scooter_tvs_iqube_st': 8,
  'electric_scooter_bajaj_chetak': 8,
  'electric_scooter_ola_s1': 8,
  'electric_scooter_ola_s1_pro': 8,
  'electric_scooter_ola_s1_air': 8,
  'electric_scooter_ola_s1_x': 8,
  'electric_scooter_hero_veda': 8,
  'electric_scooter_hero_photino': 8,
  'electric_scooter_pure_ev_epluto': 8,
  'electric_scooter_pure_ev_epluto_5g': 8,
  'electric_scooter_kinetic_zenith': 8,
  'electric_scooter_ampere_nexus': 8,
  'electric_scooter_okinawa_dual': 8,
  'electric_scooter_okinawa_ips': 8,
  'electric_scooter_govolt_mos': 8,
  'electric_scooter_jiova_et1': 8,
  
  // Electric Bikes - A+ Rating
  'electric_bike_ather_rizta': 12,
  'electric_bike_ola_roadster': 12,
  'electric_bike_ola_roadster_x': 12,
  'electric_bike_tvs_xl_heavy': 12,
  'electric_bike_hero_bolt': 12,
  
  // Petrol Scooters - C Rating (Moderate Emission)
  'petrol_scooter_honda_activa': 55,
  'petrol_scooter_honda_activa_6g': 55,
  'petrol_scooter_honda_activa_125': 55,
  'petrol_scooter_honda_dio': 55,
  'petrol_scooter_tvs_jupiter': 55,
  'petrol_scooter_tvs_ntorq': 55,
  'petrol_scooter_tvs_romeo': 55,
  'petrol_scooter_bajaj_ktm_125': 55,
  'petrol_scooter_bajaj_chetak_b': 55,
  'petrol_scooter_hero_maestro': 55,
  'petrol_scooter_hero_destini': 55,
  'petrol_scooter_hero_pleasure': 55,
  'petrol_scooter_suzuki_access': 55,
  'petrol_scooter_suzuki_burgman': 55,
  'petrol_scooter_tvs_zest': 55,
  'petrol_scooter_yamaha_fascino': 55,
  'petrol_scooter_yamaha_ray': 55,
  
  // Petrol Bikes - D Rating (Higher Emission)
  'petrol_bike_honda_cg125': 75,
  'petrol_bike_honda_cb_shine': 75,
  'petrol_bike_honda_cbr': 75,
  'petrol_bike_bajaj_pulsar': 75,
  'petrol_bike_bajaj_pulsar_ns': 75,
  'petrol_bike_bajaj_pulsar_rs': 75,
  'petrol_bike_bajaj_avenger': 75,
  'petrol_bike_ktm_duke': 75,
  'petrol_bike_ktm_rc': 75,
  'petrol_bike_tvs_apache': 75,
  'petrol_bike_tvs_rr': 75,
  'petrol_bike_hero_hunk': 75,
  'petrol_bike_hero_xtreme': 75,
  'petrol_bike_hero_glamour': 75,
  'petrol_bike_hero_passion': 75,
  'petrol_bike_suzuki_gixxer': 75,
  'petrol_bike_suzuki_intruder': 75,
  'petrol_bike_yamaha_mt': 75,
  'petrol_bike_yamaha_r15': 75,
  'petrol_bike_royal_enfield_classic': 75,
  'petrol_bike_royal_enfield_bullet': 75,
  'petrol_bike_royal_enfield_himalayan': 75,
  
  // CNG Scooters - E Rating
  'cng_scooter_bajaj_quamar': 95,
  
  // Hybrid Scooters - B Rating
  'hybrid_scooter_hero_ifez': 40
};

// Vehicle average speeds (km/h)
const VEHICLE_AVERAGE_SPEEDS = {
  // Electric Bicycles
  'electric_bicycle_hero': 20,
  'electric_bicycle_lectro': 20,
  'electric_bicycle_btwin': 22,
  'electric_bicycle_mez': 20,
  
  // Regular Bicycles
  'bicycle_hero': 15,
  'bicycle_standard': 15,
  'bicycle_road': 25,
  'bicycle_mountain': 18,
  
  // Electric Scooters
  'electric_scooter_ather_450x': 80,
  'electric_scooter_ather_450s': 80,
  'electric_scooter_ather_400': 75,
  'electric_scooter_tvs_iqube': 78,
  'electric_scooter_bajaj_chetak': 70,
  'electric_scooter_ola_s1': 90,
  'electric_scooter_ola_s1_pro': 95,
  'electric_scooter_hero_veda': 70,
  'electric_scooter_pure_ev_epluto': 65,
  'electric_scooter_okinawa_dual': 70,
  'electric_scooter_ampere_nexus': 65,
  
  // Electric Bikes
  'electric_bike_ather_rizta': 85,
  'electric_bike_ola_roadster': 100,
  'electric_bike_tvs_xl_heavy': 70,
  'electric_bike_hero_bolt': 75,
  
  // Petrol Scooters
  'petrol_scooter_honda_activa': 85,
  'petrol_scooter_honda_dio': 85,
  'petrol_scooter_tvs_jupiter': 85,
  'petrol_scooter_tvs_ntorq': 90,
  'petrol_scooter_bajaj_ktm_125': 95,
  'petrol_scooter_hero_maestro': 80,
  'petrol_scooter_suzuki_access': 85,
  'petrol_scooter_yamaha_fascino': 80,
  
  // Petrol Bikes
  'petrol_bike_honda_cg125': 90,
  'petrol_bike_bajaj_pulsar': 110,
  'petrol_bike_ktm_duke': 140,
  'petrol_bike_tvs_apache': 110,
  'petrol_bike_royal_enfield_classic': 100,
  
  // CNG
  'cng_scooter_bajaj_quamar': 70,
  
  // Hybrid
  'hybrid_scooter_hero_ifez': 75
};

// Vehicle max weight capacity (kg)
const VEHICLE_MAX_WEIGHTS = {
  // Electric Bicycles
  'electric_bicycle_hero': 80,
  'electric_bicycle_lectro': 75,
  'electric_bicycle_btwin': 85,
  'electric_bicycle_mez': 70,
  
  // Regular Bicycles
  'bicycle_hero': 50,
  'bicycle_standard': 45,
  'bicycle_road': 60,
  'bicycle_mountain': 55,
  
  // Electric Scooters
  'electric_scooter_ather_450x': 150,
  'electric_scooter_ather_450s': 150,
  'electric_scooter_tvs_iqube': 150,
  'electric_scooter_bajaj_chetak': 140,
  'electric_scooter_ola_s1': 150,
  'electric_scooter_hero_veda': 130,
  'electric_scooter_pure_ev_epluto': 120,
  'electric_scooter_okinawa_dual': 150,
  'electric_scooter_ampere_nexus': 130,
  
  // Electric Bikes
  'electric_bike_ather_rizta': 180,
  'electric_bike_ola_roadster': 200,
  'electric_bike_tvs_xl_heavy': 150,
  'electric_bike_hero_bolt': 140,
  
  // Petrol Scooters
  'petrol_scooter_honda_activa': 150,
  'petrol_scooter_honda_dio': 145,
  'petrol_scooter_tvs_jupiter': 140,
  'petrol_scooter_tvs_ntorq': 145,
  'petrol_scooter_bajaj_ktm_125': 150,
  'petrol_scooter_hero_maestro': 130,
  'petrol_scooter_suzuki_access': 140,
  
  // Petrol Bikes
  'petrol_bike_honda_cg125': 150,
  'petrol_bike_bajaj_pulsar': 160,
  'petrol_bike_ktm_duke': 150,
  'petrol_bike_tvs_apache': 155,
  'petrol_bike_royal_enfield_classic': 180,
  
  // CNG
  'cng_scooter_bajaj_quamar': 120,
  
  // Hybrid
  'hybrid_scooter_hero_ifez': 140
};

// Vehicle operating costs (INR per km)
const VEHICLE_OPERATING_COSTS = {
  // Electric - Very Low
  'electric_bicycle_hero': 0.3,
  'electric_bicycle_lectro': 0.3,
  'electric_bicycle_btwin': 0.35,
  'electric_bicycle_mez': 0.3,
  
  // Regular Bicycles - Free
  'bicycle_hero': 0,
  'bicycle_standard': 0,
  'bicycle_road': 0,
  'bicycle_mountain': 0,
  
  // Electric Scooters - Low
  'electric_scooter_ather_450x': 1.0,
  'electric_scooter_ather_450s': 1.0,
  'electric_scooter_ather_400': 0.9,
  'electric_scooter_tvs_iqube': 1.0,
  'electric_scooter_bajaj_chetak': 1.0,
  'electric_scooter_ola_s1': 1.1,
  'electric_scooter_ola_s1_pro': 1.2,
  'electric_scooter_hero_veda': 0.9,
  'electric_scooter_pure_ev_epluto': 0.8,
  'electric_scooter_okinawa_dual': 1.0,
  'electric_scooter_ampere_nexus': 0.9,
  
  // Electric Bikes
  'electric_bike_ather_rizta': 1.2,
  'electric_bike_ola_roadster': 1.3,
  'electric_bike_tvs_xl_heavy': 1.0,
  'electric_bike_hero_bolt': 0.9,
  
  // Petrol Scooters - Moderate
  'petrol_scooter_honda_activa': 2.0,
  'petrol_scooter_honda_dio': 2.0,
  'petrol_scooter_tvs_jupiter': 2.0,
  'petrol_scooter_tvs_ntorq': 2.2,
  'petrol_scooter_bajaj_ktm_125': 2.5,
  'petrol_scooter_hero_maestro': 1.8,
  'petrol_scooter_suzuki_access': 2.0,
  
  // Petrol Bikes - High
  'petrol_bike_honda_cg125': 2.5,
  'petrol_bike_bajaj_pulsar': 3.0,
  'petrol_bike_ktm_duke': 4.0,
  'petrol_bike_tvs_apache': 2.8,
  'petrol_bike_royal_enfield_classic': 3.5,
  
  // CNG - Moderate
  'cng_scooter_bajaj_quamar': 1.5,
  
  // Hybrid - Low
  'hybrid_scooter_hero_ifez': 1.2
};

// ============================================
// ECO RATING SYSTEM
// ============================================

const ECO_RATINGS = {
  'A+': ['electric_bicycle_hero', 'electric_bicycle_lectro', 'electric_bicycle_btwin', 'electric_bicycle_mez',
         'electric_scooter_ather_450x', 'electric_scooter_ather_450s', 'electric_scooter_ather_400',
         'electric_scooter_tvs_iqube', 'electric_scooter_bajaj_chetak', 'electric_scooter_ola_s1',
         'electric_scooter_ola_s1_pro', 'electric_scooter_hero_veda', 'electric_scooter_pure_ev_epluto',
         'electric_scooter_okinawa_dual', 'electric_scooter_ampere_nexus'],
  'A': ['bicycle_hero', 'bicycle_standard', 'bicycle_road', 'bicycle_mountain'],
  'B': ['hybrid_scooter_hero_ifez'],
  'C': ['petrol_scooter_honda_activa', 'petrol_scooter_honda_dio', 'petrol_scooter_tvs_jupiter',
        'petrol_scooter_tvs_ntorq', 'petrol_scooter_bajaj_ktm_125', 'petrol_scooter_hero_maestro',
        'petrol_scooter_suzuki_access', 'petrol_scooter_yamaha_fascino'],
  'D': ['petrol_bike_honda_cg125', 'petrol_bike_bajaj_pulsar', 'petrol_bike_ktm_duke',
        'petrol_bike_tvs_apache', 'petrol_bike_royal_enfield_classic'],
  'E': ['cng_scooter_bajaj_quamar']
};

// Get eco rating for a vehicle type
const getEcoRating = (vehicleType) => {
  const normalized = (vehicleType || '').toString().toLowerCase();

  // Generic categories from legacy tests and basic engine behavior
  if (normalized === 'bicycle') return 'A';
  if (normalized === 'electric_bicycle' || normalized === 'electric_scooter') return 'A+';
  if (normalized === 'petrol_scooter') return 'C';

  for (const [rating, vehicles] of Object.entries(ECO_RATINGS)) {
    if (vehicles.includes(vehicleType)) return rating;
  }
  return 'E';
};

// ============================================
// VEHICLE BRAND DISPLAY INFO
// ============================================

const VEHICLE_DISPLAY_INFO = {
  // Electric Bicycles
  'electric_bicycle_hero': { brand: 'Hero', model: 'Electric Bicycle', category: 'Electric Bicycle', isElectric: true },
  'electric_bicycle_lectro': { brand: 'Lectro', model: 'Electric Bicycle', category: 'Electric Bicycle', isElectric: true },
  'electric_bicycle_btwin': { brand: 'Btwin', model: 'Electric Bicycle', category: 'Electric Bicycle', isElectric: true },
  'electric_bicycle_mez': { brand: 'Mez', model: 'Electric Bicycle', category: 'Electric Bicycle', isElectric: true },
  
  // Regular Bicycles
  'bicycle_hero': { brand: 'Hero', model: 'Standard Bicycle', category: 'Bicycle', isElectric: false },
  'bicycle_standard': { brand: 'Generic', model: 'Standard Bicycle', category: 'Bicycle', isElectric: false },
  'bicycle_road': { brand: 'Generic', model: 'Road Bicycle', category: 'Bicycle', isElectric: false },
  'bicycle_mountain': { brand: 'Generic', model: 'Mountain Bicycle', category: 'Bicycle', isElectric: false },
  
  // Electric Scooters - Ather
  'electric_scooter_ather_450x': { brand: 'Ather', model: '450X', category: 'Electric Scooter', isElectric: true },
  'electric_scooter_ather_450s': { brand: 'Ather', model: '450S', category: 'Electric Scooter', isElectric: true },
  'electric_scooter_ather_400': { brand: 'Ather', model: '400', category: 'Electric Scooter', isElectric: true },
  
  // Electric Scooters - TVS
  'electric_scooter_tvs_iqube': { brand: 'TVS', model: 'iQube', category: 'Electric Scooter', isElectric: true },
  'electric_scooter_tvs_iqube_st': { brand: 'TVS', model: 'iQube ST', category: 'Electric Scooter', isElectric: true },
  
  // Electric Scooters - Bajaj
  'electric_scooter_bajaj_chetak': { brand: 'Bajaj', model: 'Chetak', category: 'Electric Scooter', isElectric: true },
  
  // Electric Scooters - OLA
  'electric_scooter_ola_s1': { brand: 'Ola', model: 'S1', category: 'Electric Scooter', isElectric: true },
  'electric_scooter_ola_s1_pro': { brand: 'Ola', model: 'S1 Pro', category: 'Electric Scooter', isElectric: true },
  'electric_scooter_ola_s1_air': { brand: 'Ola', model: 'S1 Air', category: 'Electric Scooter', isElectric: true },
  'electric_scooter_ola_s1_x': { brand: 'Ola', model: 'S1 X', category: 'Electric Scooter', isElectric: true },
  
  // Electric Scooters - Hero
  'electric_scooter_hero_veda': { brand: 'Hero', model: 'Veda', category: 'Electric Scooter', isElectric: true },
  'electric_scooter_hero_photino': { brand: 'Hero', model: 'Photino', category: 'Electric Scooter', isElectric: true },
  
  // Electric Scooters - Others
  'electric_scooter_pure_ev_epluto': { brand: 'Pure EV', model: 'ePluto', category: 'Electric Scooter', isElectric: true },
  'electric_scooter_pure_ev_epluto_5g': { brand: 'Pure EV', model: 'ePluto 5G', category: 'Electric Scooter', isElectric: true },
  'electric_scooter_kinetic_zenith': { brand: 'Kinetic', model: 'Zenith', category: 'Electric Scooter', isElectric: true },
  'electric_scooter_ampere_nexus': { brand: 'Ampere', model: 'Nexus', category: 'Electric Scooter', isElectric: true },
  'electric_scooter_okinawa_dual': { brand: 'Okinawa', model: 'Dual', category: 'Electric Scooter', isElectric: true },
  'electric_scooter_okinawa_ips': { brand: 'Okinawa', model: 'iPS', category: 'Electric Scooter', isElectric: true },
  'electric_scooter_govolt_mos': { brand: 'Govolt', model: 'MOS', category: 'Electric Scooter', isElectric: true },
  'electric_scooter_jiova_et1': { brand: 'Jiova', model: 'ET1', category: 'Electric Scooter', isElectric: true },
  
  // Electric Bikes
  'electric_bike_ather_rizta': { brand: 'Ather', model: 'Rizta', category: 'Electric Bike', isElectric: true },
  'electric_bike_ola_roadster': { brand: 'Ola', model: 'Roadster', category: 'Electric Bike', isElectric: true },
  'electric_bike_ola_roadster_x': { brand: 'Ola', model: 'Roadster X', category: 'Electric Bike', isElectric: true },
  'electric_bike_tvs_xl_heavy': { brand: 'TVS', model: 'XL Heavy', category: 'Electric Bike', isElectric: true },
  'electric_bike_hero_bolt': { brand: 'Hero', model: 'Bolt', category: 'Electric Bike', isElectric: true },
  
  // Petrol Scooters - Honda
  'petrol_scooter_honda_activa': { brand: 'Honda', model: 'Activa', category: 'Petrol Scooter', isElectric: false },
  'petrol_scooter_honda_activa_6g': { brand: 'Honda', model: 'Activa 6G', category: 'Petrol Scooter', isElectric: false },
  'petrol_scooter_honda_activa_125': { brand: 'Honda', model: 'Activa 125', category: 'Petrol Scooter', isElectric: false },
  'petrol_scooter_honda_dio': { brand: 'Honda', model: 'Dio', category: 'Petrol Scooter', isElectric: false },
  
  // Petrol Scooters - TVS
  'petrol_scooter_tvs_jupiter': { brand: 'TVS', model: 'Jupiter', category: 'Petrol Scooter', isElectric: false },
  'petrol_scooter_tvs_ntorq': { brand: 'TVS', model: 'Ntorq', category: 'Petrol Scooter', isElectric: false },
  'petrol_scooter_tvs_romeo': { brand: 'TVS', model: 'Romeo', category: 'Petrol Scooter', isElectric: false },
  'petrol_scooter_tvs_zest': { brand: 'TVS', model: 'Zest', category: 'Petrol Scooter', isElectric: false },
  
  // Petrol Scooters - Bajaj
  'petrol_scooter_bajaj_ktm_125': { brand: 'Bajaj', model: 'KTM 125', category: 'Petrol Scooter', isElectric: false },
  'petrol_scooter_bajaj_chetak_b': { brand: 'Bajaj', model: 'Chetak', category: 'Petrol Scooter', isElectric: false },
  
  // Petrol Scooters - Hero
  'petrol_scooter_hero_maestro': { brand: 'Hero', model: 'Maestro', category: 'Petrol Scooter', isElectric: false },
  'petrol_scooter_hero_destini': { brand: 'Hero', model: 'Destini', category: 'Petrol Scooter', isElectric: false },
  'petrol_scooter_hero_pleasure': { brand: 'Hero', model: 'Pleasure', category: 'Petrol Scooter', isElectric: false },
  
  // Petrol Scooters - Suzuki & Yamaha
  'petrol_scooter_suzuki_access': { brand: 'Suzuki', model: 'Access', category: 'Petrol Scooter', isElectric: false },
  'petrol_scooter_suzuki_burgman': { brand: 'Suzuki', model: 'Burgman', category: 'Petrol Scooter', isElectric: false },
  'petrol_scooter_yamaha_fascino': { brand: 'Yamaha', model: 'Fascino', category: 'Petrol Scooter', isElectric: false },
  'petrol_scooter_yamaha_ray': { brand: 'Yamaha', model: 'Ray', category: 'Petrol Scooter', isElectric: false },
  
  // Petrol Bikes - Honda
  'petrol_bike_honda_cg125': { brand: 'Honda', model: 'CG 125', category: 'Petrol Bike', isElectric: false },
  'petrol_bike_honda_cb_shine': { brand: 'Honda', model: 'CB Shine', category: 'Petrol Bike', isElectric: false },
  'petrol_bike_honda_cbr': { brand: 'Honda', model: 'CBR', category: 'Petrol Bike', isElectric: false },
  
  // Petrol Bikes - Bajaj
  'petrol_bike_bajaj_pulsar': { brand: 'Bajaj', model: 'Pulsar', category: 'Petrol Bike', isElectric: false },
  'petrol_bike_bajaj_pulsar_ns': { brand: 'Bajaj', model: 'Pulsar NS', category: 'Petrol Bike', isElectric: false },
  'petrol_bike_bajaj_pulsar_rs': { brand: 'Bajaj', model: 'Pulsar RS', category: 'Petrol Bike', isElectric: false },
  'petrol_bike_bajaj_avenger': { brand: 'Bajaj', model: 'Avenger', category: 'Petrol Bike', isElectric: false },
  
  // Petrol Bikes - KTM
  'petrol_bike_ktm_duke': { brand: 'KTM', model: 'Duke', category: 'Petrol Bike', isElectric: false },
  'petrol_bike_ktm_rc': { brand: 'KTM', model: 'RC', category: 'Petrol Bike', isElectric: false },
  
  // Petrol Bikes - TVS
  'petrol_bike_tvs_apache': { brand: 'TVS', model: 'Apache', category: 'Petrol Bike', isElectric: false },
  'petrol_bike_tvs_rr': { brand: 'TVS', model: 'RR', category: 'Petrol Bike', isElectric: false },
  
  // Petrol Bikes - Hero
  'petrol_bike_hero_hunk': { brand: 'Hero', model: 'Hunk', category: 'Petrol Bike', isElectric: false },
  'petrol_bike_hero_xtreme': { brand: 'Hero', model: 'Xtreme', category: 'Petrol Bike', isElectric: false },
  'petrol_bike_hero_glamour': { brand: 'Hero', model: 'Glamour', category: 'Petrol Bike', isElectric: false },
  'petrol_bike_hero_passion': { brand: 'Hero', model: 'Passion', category: 'Petrol Bike', isElectric: false },
  
  // Petrol Bikes - Suzuki & Yamaha
  'petrol_bike_suzuki_gixxer': { brand: 'Suzuki', model: 'Gixxer', category: 'Petrol Bike', isElectric: false },
  'petrol_bike_suzuki_intruder': { brand: 'Suzuki', model: 'Intruder', category: 'Petrol Bike', isElectric: false },
  'petrol_bike_yamaha_mt': { brand: 'Yamaha', model: 'MT', category: 'Petrol Bike', isElectric: false },
  'petrol_bike_yamaha_r15': { brand: 'Yamaha', model: 'R15', category: 'Petrol Bike', isElectric: false },
  
  // Petrol Bikes - Royal Enfield
  'petrol_bike_royal_enfield_classic': { brand: 'Royal Enfield', model: 'Classic', category: 'Petrol Bike', isElectric: false },
  'petrol_bike_royal_enfield_bullet': { brand: 'Royal Enfield', model: 'Bullet', category: 'Petrol Bike', isElectric: false },
  'petrol_bike_royal_enfield_himalayan': { brand: 'Royal Enfield', model: 'Himalayan', category: 'Petrol Bike', isElectric: false },
  
  // CNG
  'cng_scooter_bajaj_quamar': { brand: 'Bajaj', model: 'Quamar', category: 'CNG Scooter', isElectric: false },
  
  // Hybrid
  'hybrid_scooter_hero_ifez': { brand: 'Hero', model: 'iFeZ', category: 'Hybrid Scooter', isElectric: true }
};

// ============================================
// SCHEMA DEFINITION
// ============================================

const vehicleSchema = new mongoose.Schema({
  // Vehicle identification - Using comprehensive type system
  vehicleType: {
    type: String,
    enum: Object.keys(VEHICLE_EMISSION_FACTORS),
    required: true
  },
  licenseNumber: {
    type: String,
    required: true,
    unique: true
  },
  vehicleNumber: String,
  
  // Vehicle owner (delivery partner)
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Vehicle specifications
  make: String,
  model: String,
  year: { type: Number },
  capacity: { type: Number, default: 10 },
  
  // Status
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: true },
  
  // Current location
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number],
    updatedAt: Date
  },
  
  // Insurance and documents
  insuranceExpiry: Date,
  registrationExpiry: Date,
  documentUrls: {
    license: String,
    insurance: String,
    registration: String
  },
  
  // Statistics
  stats: {
    totalDeliveries: { type: Number, default: 0 },
    totalDistance: { type: Number, default: 0 },
    totalEmissions: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 }
  },
  
  // Carbon tracking
  carbonSaved: { type: Number, default: 0 },
  ecoScore: { type: Number, default: 0 }
  
}, {
  timestamps: true
});

// ============================================
// INDEXES
// ============================================

vehicleSchema.index({ owner: 1 });
vehicleSchema.index({ vehicleType: 1 });
vehicleSchema.index({ currentLocation: '2dsphere' });
vehicleSchema.index({ isAvailable: 1, isActive: 1 });

// ============================================
// STATIC METHODS
// ============================================

// Get emission factor for a vehicle type
vehicleSchema.statics.getEmissionFactor = function(vehicleType) {
  return VEHICLE_EMISSION_FACTORS[vehicleType] || 75;
};

// Get all vehicle types with full details
vehicleSchema.statics.getAllVehicleTypes = function() {
  return Object.keys(VEHICLE_EMISSION_FACTORS).map(type => ({
    type,
    ...VEHICLE_DISPLAY_INFO[type],
    emissionFactor: VEHICLE_EMISSION_FACTORS[type],
    averageSpeed: VEHICLE_AVERAGE_SPEEDS[type],
    maxWeight: VEHICLE_MAX_WEIGHTS[type],
    operatingCostPerKm: VEHICLE_OPERATING_COSTS[type],
    ecoRating: getEcoRating(type)
  }));
};

// Get vehicles by category
vehicleSchema.statics.getVehiclesByCategory = function(category) {
  return Object.keys(VEHICLE_DISPLAY_INFO)
    .filter(type => VEHICLE_DISPLAY_INFO[type].category === category)
    .map(type => ({
      type,
      ...VEHICLE_DISPLAY_INFO[type],
      emissionFactor: VEHICLE_EMISSION_FACTORS[type],
      averageSpeed: VEHICLE_AVERAGE_SPEEDS[type],
      ecoRating: getEcoRating(type)
    }));
};

// Get eco-friendly vehicles only (A+ and A rating)
vehicleSchema.statics.getEcoFriendlyVehicles = function() {
  return Object.keys(VEHICLE_DISPLAY_INFO)
    .filter(type => ['A+', 'A'].includes(getEcoRating(type)))
    .map(type => ({
      type,
      ...VEHICLE_DISPLAY_INFO[type],
      emissionFactor: VEHICLE_EMISSION_FACTORS[type],
      averageSpeed: VEHICLE_AVERAGE_SPEEDS[type],
      ecoRating: getEcoRating(type)
    }));
};

// Get all unique brands
vehicleSchema.statics.getAllBrands = function() {
  const brands = new Set();
  Object.values(VEHICLE_DISPLAY_INFO).forEach(info => {
    brands.add(info.brand);
  });
  return Array.from(brands);
};

// Get vehicles by brand
vehicleSchema.statics.getVehiclesByBrand = function(brand) {
  return Object.keys(VEHICLE_DISPLAY_INFO)
    .filter(type => VEHICLE_DISPLAY_INFO[type].brand === brand)
    .map(type => ({
      type,
      ...VEHICLE_DISPLAY_INFO[type],
      emissionFactor: VEHICLE_EMISSION_FACTORS[type],
      averageSpeed: VEHICLE_AVERAGE_SPEEDS[type],
      ecoRating: getEcoRating(type)
    }));
};

// ============================================
// INSTANCE METHODS
// ============================================

// Calculate emission for a distance
vehicleSchema.methods.calculateEmission = function(distanceKm) {
  const emissionFactor = VEHICLE_EMISSION_FACTORS[this.vehicleType] || 75;
  const emission = emissionFactor * distanceKm;
  
  // Baseline: petrol scooter average
  const baselineEmission = 55 * distanceKm;
  const carbonSaved = baselineEmission - emission;
  
  // Best possible: bicycle
  const bestEmission = 0;
  const maxSavings = baselineEmission - (bestEmission * distanceKm);
  
  return {
    vehicleType: this.vehicleType,
    ...VEHICLE_DISPLAY_INFO[this.vehicleType],
    distanceKm,
    emissionFactor,
    actualEmission: Math.round(emission),
    baselineEmission: Math.round(baselineEmission),
    carbonSaved: Math.round(carbonSaved),
    maxPotentialSavings: Math.round(maxSavings),
    ecoRating: getEcoRating(this.vehicleType),
    percentageSaved: Math.round((carbonSaved / baselineEmission) * 100)
  };
};

// Update stats after delivery
vehicleSchema.methods.updateStats = function(distanceKm, earnings) {
  const emissionFactor = VEHICLE_EMISSION_FACTORS[this.vehicleType] || 75;
  const emission = emissionFactor * distanceKm;
  const baselineEmission = 55 * distanceKm;
  const carbonSaved = baselineEmission - emission;
  
  // Update eco score
  const scoreGained = Math.floor(carbonSaved / 100); // 1 point per 100g saved
  
  this.stats.totalDeliveries += 1;
  this.stats.totalDistance += distanceKm;
  this.stats.totalEmissions += emission;
  this.stats.totalEarnings += earnings;
  this.carbonSaved += carbonSaved;
  this.ecoScore = Math.min(100, this.ecoScore + scoreGained);
};

// ============================================
// EXPORTS
// ============================================

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle;
module.exports.VEHICLE_EMISSION_FACTORS = VEHICLE_EMISSION_FACTORS;
module.exports.VEHICLE_AVERAGE_SPEEDS = VEHICLE_AVERAGE_SPEEDS;
module.exports.VEHICLE_MAX_WEIGHTS = VEHICLE_MAX_WEIGHTS;
module.exports.VEHICLE_OPERATING_COSTS = VEHICLE_OPERATING_COSTS;
module.exports.VEHICLE_DISPLAY_INFO = VEHICLE_DISPLAY_INFO;
module.exports.ECO_RATINGS = ECO_RATINGS;
module.exports.getEcoRating = getEcoRating;
