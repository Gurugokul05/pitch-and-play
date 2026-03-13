const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { notFound, errorHandler } = require("./middleware/errorHandler");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
app.disable("x-powered-by");
app.set("trust proxy", 1);

const parseEnvInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const apiRateLimitWindowMs = parseEnvInt(
  process.env.API_RATE_LIMIT_WINDOW_MS,
  15 * 60 * 1000,
);
const apiRateLimitMax = parseEnvInt(process.env.API_RATE_LIMIT_MAX, 5000);
const authRateLimitWindowMs = parseEnvInt(
  process.env.AUTH_RATE_LIMIT_WINDOW_MS,
  15 * 60 * 1000,
);
const authRateLimitMax = parseEnvInt(process.env.AUTH_RATE_LIMIT_MAX, 300);

const mongoMaxPoolSize = parseEnvInt(process.env.MONGO_MAX_POOL_SIZE, 100);
const mongoMinPoolSize = parseEnvInt(process.env.MONGO_MIN_POOL_SIZE, 20);
const keepAliveTimeoutMs = parseEnvInt(
  process.env.KEEP_ALIVE_TIMEOUT_MS,
  65000,
);
const headersTimeoutMs = parseEnvInt(process.env.HEADERS_TIMEOUT_MS, 66000);
const requestTimeoutMs = parseEnvInt(process.env.REQUEST_TIMEOUT_MS, 120000);

// Security Middleware
app.use(helmet());

// Compression Middleware for response compression
app.use(compression());

// Rate Limiting - Prevent abuse
const limiter = rateLimit({
  windowMs: apiRateLimitWindowMs,
  max: apiRateLimitMax,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: authRateLimitWindowMs,
  max: authRateLimitMax,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", limiter);
app.use("/api/auth/", authLimiter);

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const defaultCorsOrigins = ["http://localhost:5173", "http://localhost:5174"];
const envOriginsRaw = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || "";
const envOrigins = envOriginsRaw
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const corsOrigins = [...new Set([...defaultCorsOrigins, ...envOrigins])];

const isAllowedDevOrigin = (origin) => {
  try {
    const parsedOrigin = new URL(origin);
    const isLocalHost = ["localhost", "127.0.0.1"].includes(
      parsedOrigin.hostname,
    );
    return isLocalHost && /^\d+$/.test(parsedOrigin.port || "");
  } catch {
    return false;
  }
};

const isAllowedVercelOrigin = (origin) => {
  try {
    const parsedOrigin = new URL(origin);
    return (
      parsedOrigin.protocol === "https:" &&
      parsedOrigin.hostname.endsWith(".vercel.app")
    );
  } catch {
    return false;
  }
};

const corsOptions = {
  origin: (origin, callback) => {
    // Allow tools or same-origin requests without an Origin header.
    if (!origin) return callback(null, true);

    if (
      corsOrigins.includes(origin) ||
      isAllowedDevOrigin(origin) ||
      isAllowedVercelOrigin(origin)
    ) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(cookieParser());

// Database Connection with optimized settings
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: mongoMaxPoolSize,
      minPoolSize: mongoMinPoolSize,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("✓ MongoDB Connected Successfully");
    const server = app.listen(PORT, () => {
      console.log(`✓ Server is running on port ${PORT}`);
      console.log(`✓ CORS Origins: ${corsOrigins.join(", ")}`);
      console.log(
        `✓ Rate Limits: api=${apiRateLimitMax}/${apiRateLimitWindowMs}ms, auth=${authRateLimitMax}/${authRateLimitWindowMs}ms`,
      );
      console.log(
        `✓ Mongo Pool: min=${mongoMinPoolSize}, max=${mongoMaxPoolSize}`,
      );
    });

    server.keepAliveTimeout = keepAliveTimeoutMs;
    server.headersTimeout = headersTimeoutMs;
    server.requestTimeout = requestTimeoutMs;
  } catch (error) {
    console.error("✗ Failed to start server:");
    console.error(error.message);
    process.exitCode = 1;
  }
};

startServer();

// Static file serving for uploads
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/problems", require("./routes/problemRoutes"));
app.use("/api/teams", require("./routes/teamRoutes"));
app.use("/api/communication", require("./routes/communicationRoutes"));
app.use("/api/submissions", require("./routes/submissionRoutes"));
app.use("/api/settings", require("./routes/settingsRoutes"));
app.use("/api/admins", require("./routes/adminRoutes"));
app.get("/", (req, res) => {
  res.send("Hackathon Platform API is running...");
});

app.use(notFound);
app.use(errorHandler);
