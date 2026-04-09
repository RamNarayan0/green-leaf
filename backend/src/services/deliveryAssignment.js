/**
 * Delivery Assignment Service
 * Carbon-Optimized Delivery Partner Selection
 */

const DeliveryPartner = require('../models/DeliveryPartner');
const Order = require('../models/Order');
const { 
  VEHICLE_EMISSION_FACTORS, 
  VEHICLE_AVERAGE_SPEEDS,
  VEHICLE_DISPLAY_INFO,
  getEcoRating 
} = require('../models/Vehicle');

const calculateDistance = (coord1, coord2) => {
  if (!coord1 || !coord2) return Infinity;
  
  const R = 6371;
  const toRad = (deg) => deg * (Math.PI/180);
  const dLat = toRad(coord2[1] - coord1[1]);
  const dLon = toRad(coord2[0] - coord1[0]);
  const lat1 = toRad(coord1[1]);
  const lat2 = toRad(coord2[1]);

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const findNearbyPartners = async (customerLocation, maxDistance = 10) => {
  try {
    const partners = await DeliveryPartner.find({
      status: 'available',
      isActive: true,
      currentLocation: {
        $near: {
          $geometry: { type: 'Point', coordinates: customerLocation },
          $maxDistance: maxDistance * 1000
        }
      }
    });
    return partners;
  } catch (error) {
    const partners = await DeliveryPartner.find({
      status: 'available',
      isActive: true
    });
    
    return partners.filter(partner => {
      if (!partner.currentLocation?.coordinates) return false;
      const distance = calculateDistance(
        partner.currentLocation.coordinates,
        customerLocation
      );
      partner._calculatedDistance = distance;
      return distance <= maxDistance;
    });
  }
};

const calculatePartnerEmission = (vehicleType, distance) => {
  const emissionFactor = VEHICLE_EMISSION_FACTORS[vehicleType] || 55;
  const actualEmission = distance * emissionFactor;
  const baselineEmission = distance * 55;
  const carbonSaved = baselineEmission - actualEmission;
  const ecoRating = getEcoRating(vehicleType);
  const vehicleInfo = VEHICLE_DISPLAY_INFO[vehicleType] || {};
  
  return {
    vehicleType,
    vehicleBrand: vehicleInfo.brand || 'Unknown',
    vehicleModel: vehicleInfo.model || 'Unknown',
    emissionFactor,
    actualEmission: Math.round(actualEmission * 100) / 100,
    baselineEmission: Math.round(baselineEmission * 100) / 100,
    carbonSaved: Math.round(carbonSaved * 100) / 100,
    ecoRating,
    isElectric: vehicleInfo.isElectric || false
  };
};

const selectBestPartner = async (shopLocation, customerLocation, mode = 'eco') => {
  const nearbyPartners = await findNearbyPartners(customerLocation, 10);
  
  if (nearbyPartners.length === 0) {
    return { success: false, message: 'No available delivery partners nearby' };
  }
  
  const scoredPartners = nearbyPartners.map(partner => {
    const vehicleType = partner.vehicleType || 'electric_scooter_ather_450x';
    const partnerDistance = partner._calculatedDistance || 
      calculateDistance(partner.currentLocation?.coordinates, customerLocation);
    const totalDistance = partnerDistance + (shopLocation ? calculateDistance(shopLocation, customerLocation) : 3);
    
    const emission = calculatePartnerEmission(vehicleType, totalDistance);
    const avgSpeed = VEHICLE_AVERAGE_SPEEDS[vehicleType] || 30;
    const estimatedTime = Math.round((totalDistance / avgSpeed) * 60);
    
    const maxEmission = 500;
    const emissionScore = (emission.actualEmission / maxEmission) * 100;
    const finalScore = emissionScore;
    
    return {
      partnerId: partner._id,
      partnerName: partner.userId?.name || 'Unknown',
      vehicle: emission,
      distance: Math.round(totalDistance * 100) / 100,
      estimatedTime,
      score: Math.round(finalScore * 100) / 100
    };
  });
  
  if (mode === 'eco') {
    scoredPartners.sort((a, b) => a.vehicle.actualEmission - b.vehicle.actualEmission);
  } else if (mode === 'fast') {
    scoredPartners.sort((a, b) => a.estimatedTime - b.estimatedTime);
  } else {
    scoredPartners.sort((a, b) => a.score - b.score);
  }
  
  const selected = scoredPartners[0];
  
  return {
    success: true,
    selected: {
      partnerId: selected.partnerId,
      partnerName: selected.partnerName,
      vehicle: selected.vehicle,
      distance: selected.distance,
      estimatedTime: selected.estimatedTime
    },
    allPartners: scoredPartners,
    mode
  };
};

const assignPartnerToOrder = async (orderId, assignmentResult) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return { success: false, error: 'Order not found' };
    }
    
    order.deliveryPartner = assignmentResult.partnerId;
    order.distanceKm = assignmentResult.distance;
    order.estimatedDeliveryTime = assignmentResult.estimatedTime;
    order.emissionData = {
      vehicleType: assignmentResult.vehicle.vehicleType,
      emissionFactor: assignmentResult.vehicle.emissionFactor,
      actualEmission: assignmentResult.vehicle.actualEmission,
      baselineEmission: assignmentResult.vehicle.baselineEmission,
      carbonSaved: assignmentResult.vehicle.carbonSaved,
      ecoRating: assignmentResult.vehicle.ecoRating
    };
    order.status.current = 'assigned';
    
    await order.save();
    
    await DeliveryPartner.findByIdAndUpdate(assignmentResult.partnerId, {
      status: 'busy',
      currentOrder: orderId
    });
    
    return { success: true, order };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const autoAssignPartner = async (orderId, shopLocation, customerLocation, mode = 'eco') => {
  const result = await selectBestPartner(shopLocation, customerLocation, mode);
  
  if (!result.success) {
    return result;
  }
  
  return assignPartnerToOrder(orderId, result.selected);
};

const getOrderEmission = async (orderId) => {
  const order = await Order.findById(orderId);
  
  if (!order) {
    return { success: false, error: 'Order not found' };
  }
  
  return {
    success: true,
    order: {
      orderId: order._id,
      orderNumber: order.orderNumber,
      vehicle: order.emissionData?.vehicleType || 'Not assigned',
      emission: {
        carbonEmission: order.emissionData?.actualEmission || 0,
        carbonSaved: order.emissionData?.carbonSaved || 0,
        ecoRating: order.emissionData?.ecoRating || 'N/A'
      },
      route: {
        distance: order.distanceKm,
        estimatedTime: order.estimatedDeliveryTime
      }
    }
  };
};

module.exports = {
  findNearbyPartners,
  calculatePartnerEmission,
  selectBestPartner,
  assignPartnerToOrder,
  autoAssignPartner,
  getOrderEmission,
  calculateDistance
};
