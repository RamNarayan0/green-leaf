/**
 * Route Optimizer Service
 * Uses Dijkstra's algorithm to find optimal delivery routes
 * Prioritizes eco-friendly and shortest paths
 */

const { 
  VEHICLE_EMISSION_FACTORS, 
  VEHICLE_AVERAGE_SPEEDS,
  getEcoRating 
} = require('../models/Vehicle');
const carbonCalculator = require('../emissions/carbonCalculator');

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {Array} coord1 - [longitude, latitude]
 * @param {Array} coord2 - [longitude, latitude]
 * @returns {number} - Distance in kilometers
 */
const calculateDistance = (coord1, coord2) => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(coord2[1] - coord1[1]);
  const dLon = toRad(coord2[0] - coord1[0]);
  const lat1 = toRad(coord1[1]);
  const lat2 = toRad(coord2[1]);

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const toRad = (deg) => deg * (Math.PI / 180);

/**
 * Build a simple graph representation for route optimization
 * In production, this would use actual road network data
 * @param {Array} locations - Array of location objects with coordinates
 * @returns {object} - Graph representation
 */
const buildGraph = (locations) => {
  const graph = {};
  
  // Initialize all locations
  locations.forEach(loc => {
    graph[loc.id] = {};
  });
  
  // Connect all locations (full mesh for simplicity)
  // In production, use actual road network
  locations.forEach(from => {
    locations.forEach(to => {
      if (from.id !== to.id) {
        const distance = calculateDistance(from.coordinates, to.coordinates);
        // Add slight variation to simulate different routes
        const timeFactor = 1 + (Math.random() * 0.2); // 0-20% variation
        graph[from.id][to.id] = {
          distance: distance,
          estimatedTime: distance * 3 * timeFactor // 3 min per km average
        };
      }
    });
  });
  
  return graph;
};

/**
 * Dijkstra's algorithm implementation
 * @param {object} graph - Graph representation
 * @param {string} start - Starting node
 * @param {string} end - Ending node
 * @returns {object} - Shortest path and distance
 */
const dijkstra = (graph, start, end) => {
  const distances = {};
  const previous = {};
  const unvisited = new Set();
  
  // Initialize
  Object.keys(graph).forEach(node => {
    distances[node] = Infinity;
    previous[node] = null;
    unvisited.add(node);
  });
  
  distances[start] = 0;
  
  while (unvisited.size > 0) {
    // Find node with minimum distance
    let current = null;
    let minDist = Infinity;
    
    unvisited.forEach(node => {
      if (distances[node] < minDist) {
        minDist = distances[node];
        current = node;
      }
    });
    
    if (current === null || current === end) break;
    
    unvisited.delete(current);
    
    // Update distances to neighbors
    if (graph[current]) {
      Object.keys(graph[current]).forEach(neighbor => {
        if (unvisited.has(neighbor)) {
          const alt = distances[current] + graph[current][neighbor].distance;
          if (alt < distances[neighbor]) {
            distances[neighbor] = alt;
            previous[neighbor] = current;
          }
        }
      });
    }
  }
  
  // Reconstruct path
  const path = [];
  let current = end;
  while (current !== null) {
    path.unshift(current);
    current = previous[current];
  }
  
  return {
    path: distances[end] === Infinity ? [] : path,
    distance: distances[end]
  };
};

/**
 * Calculate carbon emission for a route
 * @param {number} distance - Distance in km
 * @param {string} vehicleType - Vehicle type
 * @returns {object} - Carbon emission data
 */
const calculateRouteEmission = (distance, vehicleType) => {
  return carbonCalculator.calculateEmission(distance, vehicleType);
};

/**
 * Find optimal route with carbon optimization
 * @param {object} options - Route options
 * @returns {object} - Optimized route
 */
const findOptimalRoute = async (options) => {
  const {
    shopLocation,
    customerLocation,
    availableVehicles = [],
    mode = 'eco' // 'eco', 'fast', 'balanced'
  } = options;
  
  // Build graph with both locations
  const locations = [
    { id: 'shop', coordinates: shopLocation },
    { id: 'customer', coordinates: customerLocation }
  ];
  
  // Add delivery partners if provided
  if (options.deliveryPartners && options.deliveryPartners.length > 0) {
    options.deliveryPartners.forEach((partner, idx) => {
      if (partner.location && partner.location.coordinates) {
        locations.push({
          id: `partner_${idx}`,
          coordinates: partner.location.coordinates,
          partner
        });
      }
    });
  }
  
  const graph = buildGraph(locations);
  
  // Find shortest path
  const result = dijkstra(graph, 'shop', 'customer');
  
  // Get best vehicle
  const bestVehicle = carbonCalculator.selectBestVehicle(availableVehicles, result.distance, mode);
  
  // Calculate emissions
  const emission = calculateRouteEmission(result.distance, bestVehicle.type);
  
  // Estimate delivery time
  const avgSpeed = VEHICLE_AVERAGE_SPEEDS[bestVehicle.type] || 30;
  const estimatedTime = Math.round((result.distance / avgSpeed) * 60); // in minutes
  
  return {
    route: result.path,
    distance: result.distance,
    estimatedTime,
    vehicle: bestVehicle,
    emission,
    ecoScore: carbonCalculator.calculateEcoScore(emission.carbonSaved)
  };
};

/**
 * Compare routes for different vehicles
 * @param {number} distance - Distance in km
 * @returns {Array} - Comparison of all vehicle routes
 */
const compareVehicleRoutes = (distance) => {
  const vehicleTypes = Object.keys(VEHICLE_EMISSION_FACTORS);
  
  return vehicleTypes.map(type => {
    const emission = calculateRouteEmission(distance, type);
    const avgSpeed = VEHICLE_AVERAGE_SPEEDS[type] || 30;
    const time = Math.round((distance / avgSpeed) * 60);
    const ecoRating = getEcoRating(type);
    
    return {
      vehicleType: type,
      emission,
      estimatedTime: time,
      ecoRating,
      isRecommended: ecoRating === 'A+' || ecoRating === 'A'
    };
  }).sort((a, b) => a.emission.carbonEmission - b.emission.carbonEmission);
};

/**
 * Find nearest available delivery partner
 * @param {Array} partners - Array of delivery partners
 * @param {Array} customerLocation - Customer coordinates
 * @returns {object} - Nearest partner info
 */
const findNearestPartner = (partners, customerLocation) => {
  if (!partners || partners.length === 0) return null;
  
  let nearest = null;
  let minDistance = Infinity;
  
  partners.forEach(partner => {
    if (partner.currentLocation && partner.currentLocation.coordinates) {
      const distance = calculateDistance(
        partner.currentLocation.coordinates,
        customerLocation
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearest = {
          partner,
          distance,
          estimatedPickupTime: Math.round((distance / 30) * 60) // 30 km/h avg
        };
      }
    }
  });
  
  return nearest;
};

/**
 * Optimize multi-stop route
 * @param {Array} stops - Array of stop locations
 * @param {string} mode - Optimization mode
 * @returns {object} - Optimized route
 */
const optimizeMultiStopRoute = (stops, mode = 'eco') => {
  if (stops.length < 2) return { route: stops, distance: 0 };
  
  // Simple nearest neighbor algorithm for TSP
  const visited = new Set();
  const route = [stops[0]];
  let totalDistance = 0;
  
  let current = stops[0];
  visited.add(stops[0].id);
  
  while (visited.size < stops.length) {
    let nearest = null;
    let minDist = Infinity;
    
    stops.forEach(stop => {
      if (!visited.has(stop.id)) {
        const dist = calculateDistance(current.coordinates, stop.coordinates);
        if (dist < minDist) {
          minDist = dist;
          nearest = stop;
        }
      }
    });
    
    if (nearest) {
      route.push(nearest);
      visited.add(nearest.id);
      totalDistance += minDist;
      current = nearest;
    }
  }
  
  // Calculate emissions for the entire route
  const bestVehicle = carbonCalculator.selectBestVehicle([], totalDistance, mode);
  const emission = calculateRouteEmission(totalDistance, bestVehicle.type);
  
  return {
    route,
    distance: totalDistance,
    vehicle: bestVehicle,
    emission,
    ecoScore: carbonCalculator.calculateEcoScore(emission.carbonSaved)
  };
};

module.exports = {
  calculateDistance,
  findOptimalRoute,
  compareVehicleRoutes,
  findNearestPartner,
  optimizeMultiStopRoute,
  dijkstra,
  buildGraph
};
