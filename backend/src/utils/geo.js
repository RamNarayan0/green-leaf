/**
 * Geographic Utility for Robust Coordinate Handling
 * Especially protective for India region [Lat 5-40, Lng 60-100]
 */

/**
 * Normalizes GeoJSON coordinates or object coordinates to [lat, lng]
 * @param {Object|Array} input - GeoJSON point object or coordinates array
 * @returns {Array} [lat, lng]
 */
const normalizeToLatLng = (input) => {
  if (!input) return [17.3850, 78.4867]; // Default to Hyderabad

  let coords;
  if (Array.isArray(input)) {
    coords = input;
  } else if (input.coordinates && Array.isArray(input.coordinates)) {
    coords = input.coordinates;
  } else if (input.lat !== undefined && input.lng !== undefined) {
    return [input.lat, input.lng];
  } else {
    return [17.3850, 78.4867];
  }

  if (coords.length < 2) return [17.3850, 78.4867];

  const [c0, c1] = coords;

  // India Heuristic Check:
  // Longitude is typically 60-100, Latitude is 5-40.
  // If c0 > 60 and c1 < 40, then c0=Lng, c1=Lat (GeoJSON Standard)
  if (c0 > 60 && c1 < 40) {
    return [c1, c0];
  }

  // If c0 < 40 and c1 > 60, then c0=Lat, c1=Lng (Swapped/Non-standard)
  if (c0 < 40 && c1 > 60) {
    return [c0, c1];
  }

  // Fallback: assume GeoJSON standard [lng, lat]
  return [c1 || 17.3850, c0 || 78.4867];
};

/**
 * Normalizes for outgoing API response as { lat, lng } object
 * @param {Object|Array} input 
 * @returns {Object} { lat, lng }
 */
const formatForApi = (input) => {
  const [lat, lng] = normalizeToLatLng(input);
  return { lat, lng };
};

module.exports = {
  normalizeToLatLng,
  formatForApi
};
