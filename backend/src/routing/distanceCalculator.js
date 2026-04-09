/**
 * Distance Calculator
 * Calculates distances using Haversine formula for route optimization
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1 in degrees
 * @param {number} lon1 - Longitude of point 1 in degrees  
 * @param {number} lat2 - Latitude of point 2 in degrees
 * @param {number} lon2 - Longitude of point 2 in degrees
 * @returns {number} - Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const toRadians = (deg) => deg * (Math.PI / 180);
  
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_KM * c;
  
  return Math.round(distance * 100) / 100;
};

/**
 * Calculate estimated delivery time
 * @param {number} distance - Distance in kilometers
 * @param {number} speed - Average speed in km/h
 * @returns {number} - Estimated time in minutes
 */
const calculateDeliveryTime = (distance, speed) => {
  const hours = distance / speed;
  return Math.ceil(hours * 60);
};

/**
 * Find nearest location from a list
 * @param {number} lat - Latitude of reference point
 * @param {number} lon - Longitude of reference point
 * @param {Array} locations - Array of location objects with lat/lon
 * @returns {object} - Nearest location and its distance
 */
const findNearest = (lat, lon, locations) => {
  let nearest = null;
  let minDistance = Infinity;
  
  for (const loc of locations) {
    const distance = calculateDistance(lat, lon, loc.lat, loc.lon);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = { ...loc, distance };
    }
  }
  
  return nearest;
};

module.exports = {
  calculateDistance,
  calculateDeliveryTime,
  findNearest,
  EARTH_RADIUS_KM
};
