const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

let io;

const initializeSocket = (server) => {
  const allowedOrigins = (
    process.env.FRONTEND_URL ||
    process.env.FRONTEND_URLS ||
    "http://localhost:3000"
  ).split(",");

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
    },
  });

  // JWT Middleware for Socket Connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication required"));

    try {
      if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET environment variable is required");
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (error) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    logger.info(`Socket connected: ${socket.user?.id} (${socket.id})`);

    // Purely functional, native room-based tracking
    // No manual Maps or arrays to prevent memory leaks!
    socket.on("join-order", ({ orderId }) => {
      if (orderId) {
        socket.join(`order:${orderId}`);
        logger.info(`User ${socket.user?.id} joined tracking room: ${orderId}`);
      }
    });

    socket.on("join-room", (roomName) => {
      if (roomName) {
        socket.join(roomName);
        logger.info(`Socket ${socket.id} joined room: ${roomName}`);
      }
    });

    socket.on("leave-order", ({ orderId }) => {
      if (orderId) {
        socket.leave(`order:${orderId}`);
        logger.info(`User ${socket.user?.id} left tracking room: ${orderId}`);
      }
    });

    socket.on(
      "update-location",
      ({ orderId, latitude, longitude, timestamp }) => {
        if (orderId && latitude && longitude) {
          const locationData = {
            orderId,
            latitude,
            longitude,
            timestamp: timestamp || new Date().toISOString(),
            deliveryPartnerId: socket.user?.id,
          };
          // Broadcast location ONLY to people in the native room
          io.to(`order:${orderId}`).emit(
            "delivery-location-update",
            locationData,
          );

          // Also broadcast to the Global Admin God-View Room
          io.to("admin-tracking").emit("global-delivery-update", locationData);
        }
      },
    );

    socket.on("join-admin-tracking", () => {
      if (socket.user?.role === "admin") {
        socket.join("admin-tracking");
        logger.info(`Admin ${socket.user?.id} joined global tracking room`);
      }
    });

    socket.on("disconnect", () => {
      logger.info(`Socket disconnected: ${socket.user?.id} (${socket.id})`);
      // NOTE: socket.io natively handles leaving all rooms on disconnect!
    });
  });
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};

// Expose helper functions for controller usage
const emitOrderStatus = (orderId, status, data = {}) => {
  if (io) {
    io.to(`order:${orderId}`).emit("order-status-update", {
      orderId,
      status,
      ...data,
      updatedAt: new Date().toISOString(),
    });
  }
};

module.exports = { initializeSocket, getIO, emitOrderStatus };
