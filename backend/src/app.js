/**
 * GreenRoute Commerce - Express Application
 * Climate-optimized quick-commerce platform
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const compression = require("compression");

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

/* =======================
   SECURITY MIDDLEWARES
======================= */
app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);

/* =======================
   ✅ FIXED CORS (IMPORTANT)
======================= */
const rawOrigins =
  process.env.FRONTEND_URL || "https://green-leaf-1.onrender.com";

const allowedOrigins = rawOrigins
  .split(",")
  .map((url) => url.trim());

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps / Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS not allowed"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-request-id"],
  })
);

/* =======================
   GENERAL MIDDLEWARES
======================= */
app.use(assignRequestId);
app.use(compression());
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* =======================
   RATE LIMITER
======================= */
app.use("/api", apiLimiter);

/* =======================
   STATIC FILES
======================= */
app.use("/images", express.static(path.join(__dirname, "../public/images")));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

/* =======================
   HEALTH CHECK
======================= */
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "GreenRoute Commerce API",
    version: "1.0.0",
  });
});

/* =======================
   API ROUTES
======================= */
app.get("/api/ping", (req, res) =>
  res.json({ message: "pong", timestamp: new Date() })
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
  deliveryRoutes
);

app.use("/api/analytics", analyticsRoutes);
app.use("/api/emissions", emissionRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/chat", chatRoutes);

/* =======================
   ROOT ROUTE
======================= */
app.get("/", (req, res) => {
  res.json({
    name: "GreenRoute Commerce API",
    version: "1.0.0",
    description: "Climate-optimized quick-commerce platform",
  });
});

/* =======================
   METRICS
======================= */
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", metrics.register.contentType);
  res.end(await metrics.register.metrics());
});

/* =======================
   404 HANDLER
======================= */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/* =======================
   ERROR HANDLER
======================= */
app.use(errorHandler);

module.exports = app;
