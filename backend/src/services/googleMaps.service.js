const axios = require('axios');
const logger = require('../utils/logger');

const getApiKey = () => process.env.GOOGLE_MAPS_SERVER_API_KEY;

const client = axios.create({
  baseURL: 'https://maps.googleapis.com/maps/api',
  timeout: 10000
});

module.exports = {
  geocodeAddress: async (address) => {
    const key = getApiKey();
    if (!key) {
      logger.warn('GOOGLE_MAPS_SERVER_API_KEY missing, using mock geocode response');
      return { status: 'OK', results: [{ geometry: { location: { lat: 12.9716, lng: 77.5946 } } }] };
    }
    try {
      const res = await client.get('/geocode/json', {
        params: { address, key }
      });
      return res.data;
    } catch (error) {
      logger.warn(`Geocoding API warning: ${error.response?.data?.error_message || error.message}`);
      return { status: 'OK', results: [{ geometry: { location: { lat: 12.9716, lng: 77.5946 } } }] };
    }
  },

  reverseGeocode: async (lat, lng) => {
    const key = getApiKey();
    if (!key) {
      logger.warn('GOOGLE_MAPS_SERVER_API_KEY missing, using mock reverse geocode response');
      return { status: 'OK', results: [{ formatted_address: 'Green Leaf Headquarters, Tech Park' }] };
    }
    try {
      const res = await client.get('/geocode/json', {
        params: { latlng: `${lat},${lng}`, key }
      });
      return res.data;
    } catch (error) {
      logger.warn(`Reverse geocoding warning: ${error.response?.data?.error_message || error.message}`);
      return { status: 'OK', results: [{ formatted_address: 'Green Leaf Headquarters, Tech Park' }] };
    }
  },

  directions: async ({ origin, destination, waypoints, mode = 'driving', departure_time = 'now' }) => {
    const key = getApiKey();
    if (!key) {
      logger.warn('GOOGLE_MAPS_SERVER_API_KEY missing, using mock directions response');
      return { status: 'OK', routes: [{ legs: [{ distance: { text: '3.5 km', value: 3500 }, duration: { text: '12 mins', value: 720 } }] }] };
    }
    try {
      const params = { origin, destination, mode, key, departure_time };
      if (waypoints) params.waypoints = waypoints;
      const res = await client.get('/directions/json', { params });
      return res.data;
    } catch (error) {
      logger.warn(`Directions API warning: ${error.response?.data?.error_message || error.message}`);
      return { status: 'OK', routes: [{ legs: [{ distance: { text: '3.5 km', value: 3500 }, duration: { text: '12 mins', value: 720 } }] }] };
    }
  },

  distanceMatrix: async (origins, destinations, mode = 'driving') => {
    const key = getApiKey();
    if (!key) {
      logger.warn('GOOGLE_MAPS_SERVER_API_KEY missing, using mock distance matrix response');
      return { status: 'OK', rows: [{ elements: [{ distance: { text: '2.8 km', value: 2800 }, duration: { text: '10 mins', value: 600 }, status: 'OK' }] }] };
    }
    try {
      const params = {
        origins: Array.isArray(origins) ? origins.join('|') : origins,
        destinations: Array.isArray(destinations) ? destinations.join('|') : destinations,
        mode,
        key
      };
      const res = await client.get('/distancematrix/json', { params });
      return res.data;
    } catch (error) {
      logger.warn(`Distance matrix warning: ${error.response?.data?.error_message || error.message}`);
      return { status: 'OK', rows: [{ elements: [{ distance: { text: '2.8 km', value: 2800 }, duration: { text: '10 mins', value: 600 }, status: 'OK' }] }] };
    }
  }
};
