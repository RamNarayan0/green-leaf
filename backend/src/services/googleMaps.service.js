const axios = require('axios');

const serverKey = process.env.GOOGLE_MAPS_SERVER_API_KEY;
if (!serverKey) {
  throw new Error('GOOGLE_MAPS_SERVER_API_KEY environment variable is required');
}

const client = axios.create({
  baseURL: 'https://maps.googleapis.com/maps/api',
  timeout: 10000
});

module.exports = {
  geocodeAddress: async (address) => {
    try {
      const res = await client.get('/geocode/json', {
        params: { address, key: serverKey }
      });
      return res.data;
    } catch (error) {
      throw new Error(`Geocoding failed: ${error.response?.data?.error_message || error.message}`);
    }
  },

  reverseGeocode: async (lat, lng) => {
    try {
      const res = await client.get('/geocode/json', {
        params: { latlng: `${lat},${lng}`, key: serverKey }
      });
      return res.data;
    } catch (error) {
      throw new Error(`Reverse geocoding failed: ${error.response?.data?.error_message || error.message}`);
    }
  },

  directions: async ({ origin, destination, waypoints, mode = 'driving', departure_time = 'now' }) => {
    try {
      const params = { origin, destination, mode, key: serverKey, departure_time };
      if (waypoints) params.waypoints = waypoints;
      const res = await client.get('/directions/json', { params });
      return res.data;
    } catch (error) {
      throw new Error(`Directions API failed: ${error.response?.data?.error_message || error.message}`);
    }
  },

  distanceMatrix: async (origins, destinations, mode='driving') => {
    const params = {
      origins: Array.isArray(origins) ? origins.join('|') : origins,
      destinations: Array.isArray(destinations) ? destinations.join('|') : destinations,
      mode,
      key: serverKey
    };
    const res = await client.get('/distancematrix/json', { params });
    return res.data;
  }
};
