/**
 * GreenRoute Commerce - Express Application
 * Climate-optimized quick-commerce platform
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

const { errorHandler } = require("./middlewares/errorHandler");
const { apiLimiter } = require("./middlewares/rateLimiter");
const { assignRequestId } = require("./middlewares/requestId.middleware");
const logger = require("./utils/logger");
const metrics = require("./utils/metrics");

// Import routes
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const shopRoutes = require("./routes/shop.routes");
const productRoutes = require("./routes/product.routes");
const orderRoutes = require("./routes/order.routes");
const deliveryRoutes = require("./routes/delivery.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const emissionRoutes = require("./routes/emission.routes");
const cartRoutes = require("./routes/cart.routes");
const uploadRoutes = require("./routes/upload.routes");
const chatRoutes = require("./routes/chat.routes");

const app = express();

// Middlewares
app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  }),
);
const rawOrigins =
  process.env.FRONTEND_URL || "http://localhost:5173,http://localhost:5174";
const allowedOrigins = rawOrigins
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-request-id"],
  }),
);
app.use(assignRequestId);
const compression = require("compression");
app.use(compression());
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Apply global rate limiter to API routes
app.use("/api", apiLimiter);

// Static files for images
app.use("/images", express.static(path.join(__dirname, "../public/images")));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "GreenRoute Commerce API",
    version: "1.0.0",
  });
});

// API Routes
app.get("/api/ping", (req, res) =>
  res.json({ message: "pong", timestamp: new Date() }),
);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/shops", shopRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use(
  "/api/delivery",
  (req, res, next) => {
    logger.debug(`[Delivery Route Hit]: ${req.method} ${req.url}`);
    next();
  },
  deliveryRoutes,
);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/emissions", emissionRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/chat", chatRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    name: "GreenRoute Commerce API",
    version: "1.0.0",
    description: "Climate-optimized quick-commerce platform",
    docs: "/docs",
  });
});

// Metrics endpoint
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", metrics.register.contentType);
  res.end(await metrics.register.metrics());
});

// 404 not found fallback
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;
