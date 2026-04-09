/**
 * Delivery Routes
 * Handles delivery partner and assignment endpoints
 */

const express = require("express");
const router = express.Router();
const deliveryController = require("../controllers/delivery.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize");

// Track delivery - requires authentication (customer, delivery partner, or admin)
router.get("/track/:orderId", authenticate, deliveryController.trackDelivery);

// Delivery partner routes
router.get(
  "/profile",
  authenticate,
  authorize("delivery_partner"),
  deliveryController.getProfile,
);
router.put(
  "/profile",
  authenticate,
  authorize("delivery_partner"),
  deliveryController.updateProfile,
);
router.post(
  "/available",
  authenticate,
  authorize("delivery_partner"),
  deliveryController.setAvailability,
);
router.put(
  "/availability",
  authenticate,
  authorize("delivery_partner"),
  deliveryController.setAvailability,
); // Alias for frontend consistency
router.get(
  "/nearby-orders",
  authenticate,
  authorize("delivery_partner"),
  deliveryController.getNearbyOrders,
);
router.post(
  "/accept/:orderId",
  authenticate,
  authorize("delivery_partner"),
  deliveryController.acceptOrder,
);
router.post(
  "/reject/:orderId",
  authenticate,
  authorize("delivery_partner"),
  deliveryController.rejectOrder,
);
router.get(
  "/my-deliveries",
  authenticate,
  authorize("delivery_partner"),
  deliveryController.getMyDeliveries,
);
router.get(
  "/current-delivery",
  authenticate,
  authorize("delivery_partner"),
  deliveryController.getCurrentDelivery,
);
router.patch(
  "/status",
  authenticate,
  authorize("delivery_partner"),
  deliveryController.updateStatus,
);
router.post(
  "/location",
  authenticate,
  authorize("delivery_partner"),
  deliveryController.updateLocation,
);
router.get(
  "/earnings",
  authenticate,
  authorize("delivery_partner"),
  deliveryController.getEarnings,
);
router.get(
  "/stats",
  authenticate,
  authorize("delivery_partner"),
  deliveryController.getStats,
);

// Admin routes
router.get(
  "/partners",
  authenticate,
  authorize("admin"),
  deliveryController.getAllPartners,
);
router.get(
  "/partners/:id",
  authenticate,
  authorize("admin"),
  deliveryController.getPartnerDetails,
);
router.get(
  "/fleet-stats",
  authenticate,
  authorize("admin"),
  deliveryController.getFleetStats,
);

module.exports = router;
